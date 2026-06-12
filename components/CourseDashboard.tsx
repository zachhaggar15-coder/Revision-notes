"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  Target,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { DEMO_COURSE_ID } from "@/lib/demo-data";
import { trackProductEvent } from "@/lib/analytics";
import {
  MAX_COURSE_DESCRIPTION_CHARS,
  MAX_COURSE_NAME_CHARS,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_MANUAL_NOTE_CHARS,
  MAX_MATERIALS_PER_COURSE,
  MAX_TEXT_UPLOAD_BYTES,
  MAX_TOTAL_COURSE_TEXT_CHARS,
  MAX_UNIVERSITY_CHARS,
  countMaterialCharacters,
  formatBytes,
} from "@/lib/limits";
import {
  createId,
  ensureDemoCourse,
  getAnalyticsState,
  getCourseModules,
  recordVisitResult,
  saveCourseModules,
  trackEvent,
} from "@/lib/storage";
import type {
  AcademicLevel,
  AnalyticsState,
  CourseModule,
  ExtractResponse,
  LearningMaterial,
  MaterialKind,
} from "@/lib/types";

const academicLevels: AcademicLevel[] = ["Undergraduate", "Masters", "PhD", "Other"];

type CourseForm = {
  name: string;
  description: string;
  university: string;
  academicLevel: AcademicLevel;
};

const initialCourseForm: CourseForm = {
  name: "",
  description: "",
  university: "",
  academicLevel: "Undergraduate",
};

type CourseDashboardProps = {
  initialLoadDemo?: boolean;
};

export function CourseDashboard({ initialLoadDemo = false }: CourseDashboardProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseModule[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(initialCourseForm);
  const [manualNote, setManualNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);

  useEffect(() => {
    const visit = recordVisitResult();
    if (visit.repeatSession) {
      trackProductEvent("repeat_session", {
        visitCount: visit.state.visitCount,
        repeatVisits: visit.state.repeatVisits,
      });
    }

    let storedCourses = getCourseModules();
    if (initialLoadDemo) {
      storedCourses = ensureDemoCourse(storedCourses);
      setAnalytics(trackEvent("demo_loaded", "Introduction to Molecular Biology"));
      trackProductEvent("demo_module_loaded", {
        source: "dashboard_demo_route",
        moduleCount: storedCourses.length,
      });
      router.replace("/dashboard");
    } else {
      setAnalytics(getAnalyticsState());
    }

    setCourses(storedCourses);
    setSelectedCourseId(storedCourses[0]?.id ?? null);
  }, [initialLoadDemo, router]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const selectedGenerationCount = selectedCourse ? getGenerationCount(selectedCourse) : 0;
  const selectedProgress = selectedCourse ? calculateCourseProgress(selectedCourse) : 0;

  function persistCourses(nextCourses: CourseModule[]) {
    setCourses(nextCourses);
    saveCourseModules(nextCourses);
  }

  function updateSelectedCourse(course: CourseModule) {
    persistCourses(courses.map((item) => (item.id === course.id ? course : item)));
  }

  function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    const now = new Date().toISOString();
    const course: CourseModule = {
      id: createId("course"),
      name: form.name.trim(),
      description: form.description.trim(),
      university: form.university.trim() || undefined,
      academicLevel: form.academicLevel,
      createdAt: now,
      updatedAt: now,
      materials: [],
      generationCount: 0,
    };

    const nextCourses = [course, ...courses];
    persistCourses(nextCourses);
    setSelectedCourseId(course.id);
    setForm(initialCourseForm);
    setAnalytics(trackEvent("module_created", course.name));
    trackProductEvent("module_created", {
      academicLevel: course.academicLevel,
      hasUniversity: Boolean(course.university),
      moduleCount: nextCourses.length,
    });
  }

  function handleLoadDemo() {
    const nextCourses = ensureDemoCourse(courses);
    persistCourses(nextCourses);
    setSelectedCourseId(DEMO_COURSE_ID);
    setAnalytics(trackEvent("demo_loaded", "Introduction to Molecular Biology"));
    trackProductEvent("demo_module_loaded", {
      source: "dashboard_button",
      moduleCount: nextCourses.length,
    });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!selectedCourse || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadError("");

    let workingCourse = selectedCourse;
    let workingCourses = courses;

    for (const file of files) {
      if (workingCourse.materials.length >= MAX_MATERIALS_PER_COURSE) {
        setUploadError(
          `This module has reached the MVP limit of ${MAX_MATERIALS_PER_COURSE} learning materials.`,
        );
        break;
      }

      try {
        validateClientUpload(file);
      } catch (error) {
        setUploadError(getErrorMessage(error));
        continue;
      }

      let material: LearningMaterial;
      try {
        material = await extractMaterial(file);
      } catch (error) {
        setUploadError(getErrorMessage(error));
        continue;
      }

      const nextTotalCharacters =
        countMaterialCharacters(workingCourse.materials) + material.extractedText.length;
      if (nextTotalCharacters > MAX_TOTAL_COURSE_TEXT_CHARS) {
        setUploadError(
          `This module is near the MVP AI limit. Keep combined notes under ${MAX_TOTAL_COURSE_TEXT_CHARS.toLocaleString()} characters before adding more material.`,
        );
        continue;
      }

      workingCourse = {
        ...workingCourse,
        updatedAt: new Date().toISOString(),
        materials: [material, ...workingCourse.materials],
      };
      workingCourses = workingCourses.map((course) =>
        course.id === workingCourse.id ? workingCourse : course,
      );
      persistCourses(workingCourses);
      setAnalytics(trackEvent("file_uploaded", file.name));
      trackProductEvent("learning_material_added", {
        materialType: material.materialType,
        materialCount: workingCourse.materials.length,
        hasTextbook: Boolean(workingCourse.masterTextbook),
      });
    }

    setIsUploading(false);
  }

  function handleManualNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCourse || !manualNote.trim()) {
      return;
    }

    if (selectedCourse.materials.length >= MAX_MATERIALS_PER_COURSE) {
      setUploadError(
        `This module has reached the MVP limit of ${MAX_MATERIALS_PER_COURSE} learning materials.`,
      );
      return;
    }

    const note = manualNote.trim();
    if (note.length > MAX_MANUAL_NOTE_CHARS) {
      setUploadError(
        `This note is too long for the MVP. Keep pasted notes under ${MAX_MANUAL_NOTE_CHARS.toLocaleString()} characters.`,
      );
      return;
    }

    if (
      countMaterialCharacters(selectedCourse.materials) + note.length >
      MAX_TOTAL_COURSE_TEXT_CHARS
    ) {
      setUploadError(
        `This module is near the MVP AI limit. Keep combined notes under ${MAX_TOTAL_COURSE_TEXT_CHARS.toLocaleString()} characters.`,
      );
      return;
    }

    const now = new Date().toISOString();
    const material: LearningMaterial = {
      id: createId("material"),
      fileName: `Manual note - ${formatDate(now)}`,
      materialType: "Text",
      uploadedAt: now,
      extractedText: note,
      extractionMethod: "Manual note",
      status: "ready",
    };

    updateSelectedCourse({
      ...selectedCourse,
      materials: [material, ...selectedCourse.materials],
      updatedAt: now,
    });
    setManualNote("");
    setAnalytics(trackEvent("file_uploaded", "Manual note"));
    trackProductEvent("learning_material_added", {
      materialType: "Text",
      materialCount: selectedCourse.materials.length + 1,
      hasTextbook: Boolean(selectedCourse.masterTextbook),
    });
    setUploadError("");
  }

  return (
    <section className="min-h-screen px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#d7eadf] bg-[#edf8f2] px-3 py-1 text-sm font-medium text-[#21745f]">
              <Layers3 size={15} aria-hidden="true" />
              Module memory workspace
            </p>
            <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
              Build a course that remembers.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6b60]">
              Create a module, upload learning materials, and generate a textbook that improves as
              the course develops.
            </p>
          </div>
          <button
            className="inline-flex w-fit items-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]"
            onClick={handleLoadDemo}
            type="button"
          >
            <BookOpenText size={16} aria-hidden="true" />
            Load demo module
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            detail="Current course memory"
            icon={<FileText size={18} />}
            label="Lectures uploaded"
            value={selectedCourse?.materials.length ?? 0}
          />
          <MetricCard
            detail="For the selected module"
            icon={<WandSparkles size={18} />}
            label="AI generations"
            value={selectedGenerationCount}
          />
          <MetricCard
            detail={selectedCourse ? "Most recent change" : "Create a module to begin"}
            icon={<Clock3 size={18} />}
            label="Last updated"
            value={selectedCourse ? formatDate(selectedCourse.updatedAt) : "Not started"}
          />
          <ProgressMetricCard
            icon={<Target size={18} />}
            label="Course progress"
            value={selectedProgress}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#e4ded3] bg-white/76 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf8f3] text-[#176b58]">
                <BarChart3 size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-[#171713]">MVP analytics</h2>
                <p className="mt-1 text-sm leading-6 text-[#6f6b60]">
                  {analytics?.aiGenerations ?? 0} total AI generation
                  {(analytics?.aiGenerations ?? 0) === 1 ? "" : "s"} and{" "}
                  {analytics?.repeatVisits ?? 0} repeat visit
                  {(analytics?.repeatVisits ?? 0) === 1 ? "" : "s"} are stored locally.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#d7eadf] bg-[#edf8f2] p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#176b58]">
                <CheckCircle2 size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-[#171713]">Next best action</h2>
                <p className="mt-1 text-sm leading-6 text-[#2d5c51]">
                  {getNextAction(selectedCourse)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <form className="surface rounded-lg p-5" onSubmit={handleCreateCourse}>
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#15251f] text-white">
                  <Plus size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-[#171713]">Create module</h2>
                  <p className="text-sm text-[#6f6b60]">Start with one course or lecture series.</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-[#34322d]">
                  Module name
                  <input
                    className="mt-2 w-full rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                    maxLength={MAX_COURSE_NAME_CHARS}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="MSc Molecular Biotechnology"
                    required
                    value={form.name}
                  />
                </label>
                <label className="block text-sm font-medium text-[#34322d]">
                  Description
                  <textarea
                    className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                    maxLength={MAX_COURSE_DESCRIPTION_CHARS}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Core lectures, seminar notes, and revision fragments."
                    value={form.description}
                  />
                </label>
                <label className="block text-sm font-medium text-[#34322d]">
                  University
                  <input
                    className="mt-2 w-full rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                    maxLength={MAX_UNIVERSITY_CHARS}
                    onChange={(event) => setForm({ ...form, university: event.target.value })}
                    placeholder="Optional"
                    value={form.university}
                  />
                </label>
                <label className="block text-sm font-medium text-[#34322d]">
                  Academic level
                  <select
                    className="mt-2 w-full rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                    onChange={(event) =>
                      setForm({ ...form, academicLevel: event.target.value as AcademicLevel })
                    }
                    value={form.academicLevel}
                  >
                    {academicLevels.map((level) => (
                      <option key={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#15251f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
                  type="submit"
                >
                  <Plus size={16} aria-hidden="true" />
                  Create module
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h2 className="px-1 text-sm font-semibold uppercase text-[#6f6b60]">
                Your modules
              </h2>
              {courses.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d8d0c3] bg-white/70 p-5 text-sm leading-6 text-[#6f6b60]">
                  Create a module named after your course, then paste your first lecture notes into
                  the course memory.
                </div>
              ) : (
                courses.map((course) => (
                  <button
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selectedCourseId === course.id
                        ? "border-[#58b79c] bg-[#edf8f2] shadow-sm"
                        : "border-[#e4ded3] bg-white/75 hover:border-[#b8cfc7]"
                    }`}
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    type="button"
                  >
                    <span className="block font-semibold text-[#171713]">{course.name}</span>
                    <span className="mt-1 block text-sm text-[#6f6b60]">
                      {course.materials.length} lecture{course.materials.length === 1 ? "" : "s"}{" "}
                      uploaded
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          {selectedCourse ? (
            <div className="space-y-6">
              <section className="surface rounded-lg p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-md bg-[#f2ede4] px-3 py-1 text-sm font-medium text-[#6b5b3f]">
                        <GraduationCap size={15} aria-hidden="true" />
                        {selectedCourse.academicLevel}
                      </span>
                      {selectedCourse.university ? (
                        <span className="rounded-md bg-white px-3 py-1 text-sm font-medium text-[#6f6b60]">
                          {selectedCourse.university}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-3xl font-semibold text-[#171713]">
                      {selectedCourse.name}
                    </h2>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-[#6f6b60]">
                      {selectedCourse.description || "No description added yet."}
                    </p>
                    <div className="mt-5 max-w-xl">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase text-[#6f6b60]">
                        <span>Course progress</span>
                        <span>{selectedProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e6dfd4]">
                        <div
                          className="h-full rounded-full bg-[#176b58] transition-all"
                          style={{ width: `${selectedProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Link
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-[#15251f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
                    href={`/textbook?courseId=${selectedCourse.id}&generate=1`}
                  >
                    <WandSparkles size={16} aria-hidden="true" />
                    Generate My Textbook
                  </Link>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
                <div className="rounded-lg border border-[#e4ded3] bg-white/78 p-6 shadow-sm">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#171713]">Learning materials</h2>
                      <p className="mt-1 text-sm text-[#6f6b60]">
                        PDF, image, PowerPoint, and text uploads become course memory.
                      </p>
                    </div>
                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <UploadCloud size={16} aria-hidden="true" />
                      )}
                      {isUploading ? "Reading files" : "Upload"}
                      <input
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.pptx,.txt,.md,.markdown,text/plain,application/pdf,image/*"
                        className="sr-only"
                        disabled={isUploading}
                        multiple
                        onChange={handleFileUpload}
                        type="file"
                      />
                    </label>
                  </div>

                  {uploadError ? (
                    <div
                      aria-live="polite"
                      className="mb-4 rounded-lg border border-[#f1cf9a] bg-[#fff7e5] p-4 text-sm font-medium text-[#795200]"
                      role="status"
                    >
                      {uploadError}
                    </div>
                  ) : null}

                  {selectedCourse.materials.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#d8d0c3] bg-[#fbfaf7] p-8 text-center">
                      <FileText className="mx-auto mb-3 text-[#7d766a]" size={28} />
                      <p className="font-medium text-[#34322d]">Add your first lecture.</p>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f6b60]">
                        Paste rough notes in the quick note panel or upload a slide deck, PDF, or
                        screenshot. CourseMind needs at least one source before it can write the
                        textbook.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCourse.materials.map((material) => (
                        <article
                          className="rounded-lg border border-[#e4ded3] bg-[#fbfaf7] p-4"
                          key={material.id}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#21745f]">
                                {material.materialType === "Image" ? (
                                  <FileImage size={18} aria-hidden="true" />
                                ) : (
                                  <FileText size={18} aria-hidden="true" />
                                )}
                              </span>
                              <div>
                                <h3 className="font-semibold text-[#171713]">
                                  {material.fileName}
                                </h3>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#6f6b60]">
                                  <span>{material.materialType}</span>
                                  <span aria-hidden="true">/</span>
                                  <span>{formatDate(material.uploadedAt)}</span>
                                  <span aria-hidden="true">/</span>
                                  <span>{material.extractionMethod}</span>
                                </p>
                              </div>
                            </div>
                            <span
                              className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${
                                material.status === "ready"
                                  ? "bg-[#e5f6ee] text-[#21745f]"
                                  : "bg-[#fff5d6] text-[#7a5a00]"
                              }`}
                            >
                              {material.status === "ready" ? "Ready" : "Review"}
                            </span>
                          </div>
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-semibold text-[#2f6f60]">
                              Extracted text
                            </summary>
                            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md border border-[#e4ded3] bg-white p-4 text-sm leading-6 text-[#34322d]">
                              {material.extractedText}
                            </pre>
                          </details>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <section className="rounded-lg border border-[#e4ded3] bg-white/78 p-5 shadow-sm">
                    <h2 className="font-semibold text-[#171713]">Textbook status</h2>
                    <div className="mt-4 space-y-3 text-sm text-[#6f6b60]">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} aria-hidden="true" />
                        Updated {formatDate(selectedCourse.updatedAt)}
                      </p>
                      <p>
                        {selectedCourse.masterTextbook
                          ? `Generated ${formatDate(
                              selectedCourse.textbookUpdatedAt || selectedCourse.updatedAt,
                            )}`
                          : "No textbook generated yet."}
                      </p>
                    </div>
                    <Link
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]"
                      href={`/textbook?courseId=${selectedCourse.id}`}
                    >
                      <BookOpenText size={16} aria-hidden="true" />
                      Open textbook
                    </Link>
                  </section>

                  <form
                    className="rounded-lg border border-[#e4ded3] bg-white/78 p-5 shadow-sm"
                    onSubmit={handleManualNote}
                  >
                    <h2 className="font-semibold text-[#171713]">Paste lecture notes</h2>
                    <p className="mt-1 text-sm leading-6 text-[#6f6b60]">
                      Rough bullets are fine. CourseMind will organise them later.
                    </p>
                    <textarea
                      className="mt-4 min-h-40 w-full resize-y rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                      maxLength={MAX_MANUAL_NOTE_CHARS}
                      onChange={(event) => setManualNote(event.target.value)}
                      placeholder="BRCA1 involved in homologous recombination..."
                      value={manualNote}
                    />
                    <p className="mt-2 text-xs text-[#6f6b60]">
                      {manualNote.length.toLocaleString()} /{" "}
                      {MAX_MANUAL_NOTE_CHARS.toLocaleString()} characters
                    </p>
                    <button
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#15251f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
                      type="submit"
                    >
                      <Plus size={16} aria-hidden="true" />
                      Add to memory
                    </button>
                  </form>
                </div>
              </section>
            </div>
          ) : (
            <section className="surface rounded-lg p-10 text-center">
              <BookOpenText className="mx-auto mb-4 text-[#21745f]" size={34} />
              <h2 className="text-2xl font-semibold text-[#171713]">Create your first module</h2>
              <p className="mx-auto mt-3 max-w-xl text-[#6f6b60]">
                CourseMind works best when every upload belongs to a named course or module.
              </p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  detail?: string;
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#e4ded3] bg-white/82 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[#21745f]">{icon}</span>
        <span className="text-right text-2xl font-semibold text-[#171713]">{value}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#34322d]">{label}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-[#6f6b60]">{detail}</p> : null}
    </div>
  );
}

function ProgressMetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[#e4ded3] bg-white/82 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[#21745f]">{icon}</span>
        <span className="text-2xl font-semibold text-[#171713]">{value}%</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#34322d]">{label}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6dfd4]">
        <div
          className="h-full rounded-full bg-[#176b58] transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

async function extractMaterial(file: File): Promise<LearningMaterial> {
  const now = new Date().toISOString();

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/api/extract", {
      body: formData,
      method: "POST",
    });

    const data = (await response.json()) as Partial<ExtractResponse> & ApiErrorPayload;

    if (!response.ok || data.error) {
      throw new Error(getApiErrorMessage(data) || "Extraction failed.");
    }

    if (!data.fileName || !data.materialType || !data.extractedText || !data.extractionMethod) {
      throw new Error("Extraction response was incomplete.");
    }

    return {
      id: createId("material"),
      fileName: data.fileName,
      materialType: data.materialType,
      uploadedAt: now,
      extractedText: data.extractedText,
      extractionMethod: data.extractionMethod,
      status: data.warning ? "needs_review" : "ready",
    };
  } catch (error) {
    if (isTextFile(file)) {
      const fallbackText = await getClientFallbackText(file);
      return {
        id: createId("material"),
        fileName: file.name,
        materialType: "Text",
        uploadedAt: now,
        extractedText: fallbackText,
        extractionMethod: "Browser fallback",
        status: "ready",
      };
    }

    throw error;
  }
}

async function getClientFallbackText(file: File) {
  if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
    return file.text();
  }

  return "File uploaded, but local extraction could not read this file in the browser. Add a quick note with the key learning points to strengthen the course memory.";
}

function inferMaterialKind(file: File): MaterialKind {
  const name = file.name.toLowerCase();

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "PDF";
  }

  if (file.type.startsWith("image/")) {
    return "Image";
  }

  if (name.endsWith(".pptx")) {
    return "PowerPoint";
  }

  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return "Text";
  }

  return "Other";
}

function validateClientUpload(file: File) {
  const materialType = inferMaterialKind(file);
  const maxBytes =
    materialType === "Text"
      ? MAX_TEXT_UPLOAD_BYTES
      : materialType === "Image"
        ? MAX_IMAGE_UPLOAD_BYTES
        : MAX_DOCUMENT_UPLOAD_BYTES;

  if (materialType === "Other") {
    throw new Error(
      "This file type is not supported yet. Upload PDF, PowerPoint, image, Markdown, or plain text files.",
    );
  }

  if (file.size > maxBytes) {
    throw new Error(
      `${file.name} is too large. Keep ${materialType.toLowerCase()} uploads under ${formatBytes(maxBytes)}.`,
    );
  }
}

function isTextFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("text/") ||
    [".txt", ".md", ".markdown", ".csv"].some((extension) => name.endsWith(extension))
  );
}

type ApiErrorPayload = {
  error?: string | {
    message?: string;
  };
};

function getApiErrorMessage(payload: ApiErrorPayload) {
  if (typeof payload.error === "string") {
    return payload.error;
  }

  return payload.error?.message;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "CourseMind could not process that file. Try a smaller file or paste the notes manually.";
}

function getGenerationCount(course: CourseModule) {
  return course.generationCount ?? (course.masterTextbook ? 1 : 0);
}

function calculateCourseProgress(course: CourseModule) {
  const materialProgress = Math.min(course.materials.length, 4) * 15;
  const generatedProgress = course.masterTextbook ? 30 : 0;
  const recentProgress = course.materials.length > 0 ? 10 : 0;

  return Math.min(100, materialProgress + generatedProgress + recentProgress);
}

function getNextAction(course?: CourseModule) {
  if (!course) {
    return "Create a module for one course, then add the first lecture or seminar notes.";
  }

  if (course.materials.length === 0) {
    return "Paste rough lecture notes or upload your first slide deck to start the course memory.";
  }

  if (!course.masterTextbook) {
    return "Generate the first textbook so CourseMind can organise this module into revision material.";
  }

  return "Add the next lecture after class, then regenerate to keep the textbook current.";
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
