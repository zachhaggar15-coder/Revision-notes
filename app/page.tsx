import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Layers3,
  Lightbulb,
  Lock,
  MessageSquareText,
  Route,
  Sparkles,
  UploadCloud,
} from "lucide-react";

const workflow = [
  {
    title: "Messy notes",
    description: "Replication notes, screenshots, half-finished ideas, slide fragments.",
    content: "polymerase adds nucleotides / leading + lagging / mutations during copying",
    icon: FileText,
  },
  {
    title: "AI understanding",
    description: "CourseMind keeps the module context and connects new material to earlier weeks.",
    content: "Week 3 mutation content links back to Week 1 replication mechanisms.",
    icon: BrainCircuit,
  },
  {
    title: "Personal textbook",
    description: "A structured study guide with definitions, connections, gaps, and exam practice.",
    content: "Structured notes + concept links + flashcards + potential exam questions",
    icon: BookOpenText,
  },
];

const chatGptComparison = [
  "One conversation loses the shape of the whole module.",
  "Students repeat background context every time they revise.",
  "CourseMind stores a course memory locally and rebuilds the textbook as the course grows.",
];

const memoryFeatures = [
  {
    title: "Every upload becomes course memory",
    description: "Lecture notes, PDFs, slide text, screenshots, and pasted ideas sit in one module.",
    icon: UploadCloud,
  },
  {
    title: "Later weeks connect to earlier concepts",
    description: "New material is merged with existing notes instead of becoming another isolated chat.",
    icon: Route,
  },
  {
    title: "The textbook evolves",
    description: "Regenerate when the module changes and keep improving the same study guide.",
    icon: Layers3,
  },
];

const steps = [
  "Create a module for one course.",
  "Paste notes or upload learning materials after each lecture.",
  "Generate a personalised textbook before revision sessions.",
];

const futureFeatures = [
  "Lecture-by-lecture progress timeline",
  "Practice mode for weak topics",
  "Revision plan from exam dates",
  "Tutor-style oral questioning",
];

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden px-5 pb-12 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1fr]">
          <div className="float-in">
            <p className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#cce7dc] bg-white px-3 py-1 text-sm font-semibold text-[#176b58] shadow-sm">
              <Sparkles size={15} aria-hidden="true" />
              Course memory for serious study
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] text-[#11120f] sm:text-6xl lg:text-7xl">
              Your degree has an AI memory.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5f5a50]">
              Upload lectures, notes, and ideas. CourseMind continuously builds a personalised
              textbook that grows with your course.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#12251f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#203b32]"
                href="/dashboard"
              >
                Start building your course
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-5 py-3 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]"
                href="/dashboard/demo"
              >
                Open demo module
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 -top-6 h-24 rounded-full bg-[#dff4ed] blur-3xl" aria-hidden="true" />
            <div className="surface relative rounded-lg p-4">
              <div className="rounded-lg border border-[#e3ded2] bg-[#fcfbf8] p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  {workflow.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        className="relative rounded-lg border border-[#e5ded2] bg-white p-4 shadow-sm"
                        key={item.title}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8f3] text-[#176b58]">
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span className="text-xs font-semibold text-[#8a8173]">
                            0{index + 1}
                          </span>
                        </div>
                        <h2 className="mt-5 text-base font-semibold text-[#171713]">{item.title}</h2>
                        <p className="mt-2 min-h-14 text-sm leading-6 text-[#6f6b60]">
                          {item.description}
                        </p>
                        <div className="mt-4 rounded-md border border-[#ebe4d8] bg-[#fbfaf7] p-3 text-sm leading-6 text-[#34322d]">
                          {item.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg bg-[#12251f] p-5 text-white shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#aee8d5]">
                    <Sparkles size={16} aria-hidden="true" />
                    CourseMind textbook preview
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      "Definition: DNA polymerase adds nucleotides to a growing strand.",
                      "Connection: mismatch repair explains how replication errors are corrected.",
                      "Exam angle: compare leading and lagging strand synthesis.",
                      "Missing context: add proofreading lecture notes.",
                    ].map((item) => (
                      <div className="rounded-md bg-white/8 p-3 text-sm leading-6 text-white/88" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase text-[#176b58]">
              Why not just use ChatGPT?
            </p>
            <h2 className="text-3xl font-semibold text-[#171713] sm:text-4xl">
              Chat is useful. Course memory is different.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6f6b60]">
              CourseMind is built around a module, not a single prompt. It keeps the study context
              close so revision material can improve across the semester.
            </p>
          </div>
          <div className="grid gap-3">
            {chatGptComparison.map((item) => (
              <div
                className="flex items-start gap-3 rounded-lg border border-[#e4ded3] bg-white/82 p-4 shadow-sm"
                key={item}
              >
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#176b58]" size={18} aria-hidden="true" />
                <p className="text-sm leading-6 text-[#34322d]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase text-[#176b58]">
              How CourseMind remembers
            </p>
            <h2 className="text-3xl font-semibold text-[#171713] sm:text-4xl">
              A living textbook for one course at a time.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {memoryFeatures.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className="rounded-lg border border-[#e4ded3] bg-white/82 p-6 shadow-sm"
                  key={item.title}
                >
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf8f3] text-[#176b58]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="text-lg font-semibold text-[#171713]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#6f6b60]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="surface mx-auto grid max-w-7xl gap-8 rounded-lg p-6 md:grid-cols-[0.8fr_1fr] md:p-8">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase text-[#176b58]">How it works</p>
            <h2 className="text-3xl font-semibold text-[#171713]">
              Three steps from lecture fragments to revision system.
            </h2>
          </div>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <div className="flex items-center gap-4 rounded-lg border border-[#e4ded3] bg-white p-4" key={step}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12251f] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-[#34322d]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#d7eadf] bg-white px-3 py-1 text-sm font-semibold text-[#176b58] shadow-sm">
              <Lightbulb size={15} aria-hidden="true" />
              Coming soon
            </p>
            <h2 className="text-3xl font-semibold text-[#171713] sm:text-4xl">
              Built for the rest of the degree.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#6f6b60]">
              The MVP validates the course-memory workflow first. These are the natural next layers
              once students prove they come back.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {futureFeatures.map((feature) => (
              <div
                className="rounded-lg border border-[#e4ded3] bg-white/82 p-4 text-sm font-semibold text-[#34322d] shadow-sm"
                key={feature}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#e4ded3] bg-white px-3 py-1 text-sm font-semibold text-[#6f6b60] shadow-sm">
            <Lock size={15} aria-hidden="true" />
            MVP: local storage, no accounts, no payments
          </p>
          <h2 className="text-3xl font-semibold text-[#171713] sm:text-4xl">
            Try it with a real module or open the demo.
          </h2>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#12251f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#203b32]"
              href="/dashboard"
            >
              Start building
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d8d0c3] bg-white px-5 py-3 text-sm font-semibold text-[#24231f] shadow-sm transition hover:border-[#98c7b9]"
              href="/dashboard/demo"
            >
              <MessageSquareText size={16} aria-hidden="true" />
              View demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
