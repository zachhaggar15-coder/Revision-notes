"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpenText,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  ShieldCheck,
  WandSparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { trackProductEvent } from "@/lib/analytics";
import {
  AI_CLIENT_TIMEOUT_MS,
  MAX_TOTAL_COURSE_TEXT_CHARS,
  countMaterialCharacters,
} from "@/lib/limits";
import {
  createId,
  getFeedbackForCourse,
  getCourseModules,
  recordVisitResult,
  saveFeedbackForCourse,
  saveCourseModules,
  trackEvent,
} from "@/lib/storage";
import type { CourseModule } from "@/lib/types";

type Section = {
  title: string;
  body: string;
};

type GenerateTextbookResponse = {
  textbook?: string;
  error?: string | {
    message?: string;
    retryAfterSeconds?: number;
  };
};

export function TextbookWorkspace() {
  const searchParams = useSearchParams();
  const autoGenerateStarted = useRef(false);
  const [courses, setCourses] = useState<CourseModule[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [feedbackUseful, setFeedbackUseful] = useState<boolean | null>(null);
  const [feedbackMissing, setFeedbackMissing] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  useEffect(() => {
    const visit = recordVisitResult();
    if (visit.repeatSession) {
      trackProductEvent("repeat_session", {
        visitCount: visit.state.visitCount,
        repeatVisits: visit.state.repeatVisits,
      });
    }

    const storedCourses = getCourseModules();
    const requestedCourseId = searchParams.get("courseId");
    setCourses(storedCourses);
    setSelectedCourseId(
      requestedCourseId && storedCourses.some((course) => course.id === requestedCourseId)
        ? requestedCourseId
        : storedCourses[0]?.id ?? null,
    );
  }, [searchParams]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId],
  );

  const markdown = selectedCourse?.masterTextbook || "";
  const sections = useMemo(() => splitMarkdownSections(markdown), [markdown]);

  useEffect(() => {
    if (!selectedCourse?.id) {
      setFeedbackUseful(null);
      setFeedbackMissing("");
      setFeedbackSaved(false);
      return;
    }

    const existingFeedback = getFeedbackForCourse(selectedCourse.id);
    setFeedbackUseful(existingFeedback?.useful ?? null);
    setFeedbackMissing(existingFeedback?.missing ?? "");
    setFeedbackSaved(Boolean(existingFeedback));
  }, [selectedCourse?.id]);

  const generateTextbook = useCallback(async (course: CourseModule) => {
    if (course.materials.length === 0) {
      setError("Add at least one learning material before generating a textbook.");
      return;
    }

    if (countMaterialCharacters(course.materials) > MAX_TOTAL_COURSE_TEXT_CHARS) {
      setError(
        `This module is too large for the MVP AI limit. Keep combined notes under ${MAX_TOTAL_COURSE_TEXT_CHARS.toLocaleString()} characters, then try again.`,
      );
      return;
    }

    setIsGenerating(true);
    setError("");
    setRetryAfterSeconds(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), AI_CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/generate-textbook", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ course }),
      });
      const data = (await response.json()) as GenerateTextbookResponse;

      if (!response.ok || !data.textbook) {
        const parsedError = getApiErrorMessage(data);
        setRetryAfterSeconds(parsedError.retryAfterSeconds ?? null);
        throw new Error(parsedError.message || "Generation failed.");
      }

      const now = new Date().toISOString();
      const updatedCourse: CourseModule = {
        ...course,
        masterTextbook: data.textbook,
        textbookUpdatedAt: now,
        updatedAt: now,
        generationCount: (course.generationCount ?? (course.masterTextbook ? 1 : 0)) + 1,
      };
      const nextCourses = courses.map((item) =>
        item.id === updatedCourse.id ? updatedCourse : item,
      );

      setCourses(nextCourses);
      saveCourseModules(nextCourses);
      trackEvent("ai_generation_triggered", course.name);
      trackProductEvent("ai_generation", {
        academicLevel: course.academicLevel,
        materialCount: course.materials.length,
        hadExistingTextbook: Boolean(course.masterTextbook),
        generationCount: updatedCourse.generationCount ?? 1,
      });
      setFeedbackUseful(null);
      setFeedbackMissing("");
      setFeedbackSaved(false);
    } catch (generationError) {
      setError(
        generationError instanceof DOMException && generationError.name === "AbortError"
          ? "Generation took too long. Try again, or split a very large module into smaller notes."
          : generationError instanceof Error
            ? generationError.message
            : "Unable to generate textbook.",
      );
    } finally {
      window.clearTimeout(timeout);
      setIsGenerating(false);
    }
  }, [courses]);

  useEffect(() => {
    if (
      searchParams.get("generate") === "1" &&
      selectedCourse &&
      !autoGenerateStarted.current
    ) {
      autoGenerateStarted.current = true;
      void generateTextbook(selectedCourse);
    }
  }, [generateTextbook, searchParams, selectedCourse]);

  async function copyTextbook() {
    if (!markdown) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadTextbook() {
    if (!selectedCourse || !markdown) {
      return;
    }

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(selectedCourse.name)}-coursemind-textbook.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function submitFeedback(useful: boolean, missing = feedbackMissing) {
    if (!selectedCourse) {
      return;
    }

    saveFeedbackForCourse({
      id: createId("feedback"),
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      useful,
      missing: useful ? undefined : missing.trim(),
      createdAt: new Date().toISOString(),
    });
    trackProductEvent("textbook_feedback", {
      useful,
      materialCount: selectedCourse.materials.length,
      generationCount: selectedCourse.generationCount ?? (selectedCourse.masterTextbook ? 1 : 0),
      includedMissingReason: !useful && Boolean(missing.trim()),
    });
    setFeedbackUseful(useful);
    setFeedbackSaved(true);
  }

  if (courses.length === 0) {
    return (
      <section className="min-h-screen px-5 py-16 sm:px-6 lg:px-8">
        <div className="surface mx-auto max-w-3xl rounded-lg p-10 text-center">
          <BookOpenText className="mx-auto mb-4 text-[#21745f]" size={36} />
          <h1 className="text-3xl font-semibold text-[#171713]">No module found</h1>
          <p className="mx-auto mt-4 max-w-xl text-[#6f6b60]">
            Create a course module or load the demo module before generating a textbook.
          </p>
          <Link
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#15251f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
            href="/dashboard"
          >
            <WandSparkles size={16} aria-hidden="true" />
            Open dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen px-5 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#d7eadf] bg-[#edf8f2] px-3 py-1 text-sm font-medium text-[#21745f]">
              <BookOpenText size={15} aria-hidden="true" />
              AI textbook
            </p>
            <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
              {selectedCourse?.name || "Course textbook"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6b60]">
              An evolving revision textbook created from the full module memory stored in this
              browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!markdown}
              onClick={copyTextbook}
              type="button"
            >
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? "Copied" : "Copy notes"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!markdown}
              onClick={downloadTextbook}
              type="button"
            >
              <Download size={16} aria-hidden="true" />
              Download Markdown
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[#15251f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32] disabled:cursor-wait disabled:opacity-70"
              disabled={!selectedCourse || isGenerating}
              onClick={() => selectedCourse && generateTextbook(selectedCourse)}
              type="button"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              ) : (
                <RefreshCw size={16} aria-hidden="true" />
              )}
              Regenerate
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-5">
            <label className="block rounded-lg border border-[#e4ded3] bg-white/80 p-4 text-sm font-medium text-[#34322d] shadow-sm">
              Module
              <select
                className="mt-2 w-full rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                onChange={(event) => setSelectedCourseId(event.target.value)}
                value={selectedCourseId ?? ""}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <section className="rounded-lg border border-[#e4ded3] bg-white/80 p-4 shadow-sm">
              <h2 className="font-semibold text-[#171713]">Source memory</h2>
              <div className="mt-4 space-y-3 text-sm text-[#6f6b60]">
                <p>{selectedCourse?.materials.length ?? 0} uploaded material sources</p>
                <p>
                  {selectedCourse?.textbookUpdatedAt
                    ? `Last generated ${formatDate(selectedCourse.textbookUpdatedAt)}`
                    : "No generation yet"}
                </p>
              </div>
              <Link
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-4 py-2.5 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]"
                href="/dashboard"
              >
                <BookOpenText size={16} aria-hidden="true" />
                Back to dashboard
              </Link>
            </section>
          </aside>

          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-lg border border-[#d9eadf] bg-[#edf8f2] p-4 text-sm leading-6 text-[#2d5c51]">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
              <p>
                Remember: always verify AI-generated study materials against your course materials.
              </p>
            </div>

            {error ? (
              <div
                aria-live="polite"
                className="rounded-lg border border-[#f1cf9a] bg-[#fff7e5] p-4 text-sm font-medium text-[#795200]"
                role="alert"
              >
                <p>{error}</p>
                {retryAfterSeconds ? (
                  <p className="mt-2 text-xs">
                    Retry available in about {retryAfterSeconds} seconds.
                  </p>
                ) : null}
                {selectedCourse ? (
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#d6b979] bg-white px-3 py-2 text-xs font-semibold text-[#795200] transition hover:border-[#b9913a] disabled:cursor-wait disabled:opacity-60"
                    disabled={isGenerating}
                    onClick={() => generateTextbook(selectedCourse)}
                    type="button"
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Try again
                  </button>
                ) : null}
              </div>
            ) : null}

            {isGenerating ? (
              <div aria-live="polite" className="surface rounded-lg p-12 text-center" role="status">
                <Loader2 className="mx-auto mb-4 animate-spin text-[#21745f]" size={34} />
                <h2 className="text-2xl font-semibold text-[#171713]">
                  Building your course memory
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[#6f6b60]">
                  CourseMind is merging uploaded materials, finding connections, and preparing
                  revision sections.
                </p>
              </div>
            ) : markdown ? (
              <div className="space-y-5">
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <details
                      className="rounded-lg border border-[#e4ded3] bg-white/90 shadow-sm"
                      key={`${section.title}-${index}`}
                      open={index < 2}
                    >
                      <summary className="cursor-pointer px-5 py-4 text-lg font-semibold text-[#171713] transition hover:bg-[#fbfaf7]">
                        {section.title}
                      </summary>
                      <div className="border-t border-[#ede6dc] px-5 py-5">
                        <MarkdownViewer content={section.body} />
                      </div>
                    </details>
                  ))}
                </div>

                <section className="rounded-lg border border-[#e4ded3] bg-white/90 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#171713]">Was this useful?</h2>
                      <p className="mt-1 text-sm leading-6 text-[#6f6b60]">
                        Your answer is stored locally and helps validate whether CourseMind is
                        producing revision material worth returning to.
                      </p>
                    </div>
                    {feedbackSaved ? (
                      <span className="w-fit rounded-md bg-[#e5f6ee] px-3 py-1 text-xs font-semibold text-[#21745f]">
                        Feedback saved
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className={`rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        feedbackUseful === true
                          ? "border-[#58b79c] bg-[#edf8f2] text-[#176b58]"
                          : "border-[#d8d0c3] bg-white text-[#24231f] hover:border-[#98c7b9]"
                      }`}
                      onClick={() => submitFeedback(true)}
                      type="button"
                    >
                      {"\u{1F44D} Yes"}
                    </button>
                    <button
                      className={`rounded-md border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        feedbackUseful === false
                          ? "border-[#e2b7a3] bg-[#fff1eb] text-[#7c3f27]"
                          : "border-[#d8d0c3] bg-white text-[#24231f] hover:border-[#d8ad9b]"
                      }`}
                      onClick={() => {
                        setFeedbackUseful(false);
                        setFeedbackSaved(false);
                      }}
                      type="button"
                    >
                      {"\u{1F44E} No"}
                    </button>
                  </div>

                  {feedbackUseful === false ? (
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-[#34322d]">
                        What was missing?
                        <textarea
                          className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#d8d0c3] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#299174] focus:ring-4 focus:ring-[#bdebdc]"
                          onChange={(event) => setFeedbackMissing(event.target.value)}
                          placeholder="For example: more detail on Week 3, clearer definitions, better exam questions..."
                          value={feedbackMissing}
                        />
                      </label>
                      <button
                        className="mt-3 inline-flex items-center justify-center rounded-md bg-[#15251f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
                        onClick={() => submitFeedback(false)}
                        type="button"
                      >
                        Save feedback
                      </button>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : (
              <div className="surface rounded-lg p-12 text-center">
                <WandSparkles className="mx-auto mb-4 text-[#21745f]" size={34} />
                <h2 className="text-2xl font-semibold text-[#171713]">
                  Generate your first textbook
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-[#6f6b60]">
                  CourseMind will turn the module memory into structured notes, flashcards,
                  concept connections, and exam questions.
                </p>
                <button
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#15251f] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
                  onClick={() => selectedCourse && generateTextbook(selectedCourse)}
                  type="button"
                >
                  <WandSparkles size={16} aria-hidden="true" />
                  Generate My Textbook
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function splitMarkdownSections(markdown: string): Section[] {
  if (!markdown.trim()) {
    return [];
  }

  const withoutTitle = markdown.replace(/^#\s+.+\n?/, "").trim();
  const chunks = withoutTitle.split(/\n(?=##\s+)/).filter(Boolean);

  if (chunks.length === 0) {
    return [{ title: "Generated Textbook", body: markdown }];
  }

  return chunks.map((chunk) => {
    const titleMatch = chunk.match(/^##\s+(.+)/);
    return {
      title: titleMatch?.[1]?.trim() || "Textbook Section",
      body: chunk.replace(/^##\s+.+\n?/, "").trim(),
    };
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

function getApiErrorMessage(payload: GenerateTextbookResponse) {
  if (typeof payload.error === "string") {
    return {
      message: payload.error,
      retryAfterSeconds: undefined,
    };
  }

  return {
    message: payload.error?.message,
    retryAfterSeconds: payload.error?.retryAfterSeconds,
  };
}
