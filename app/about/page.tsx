import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description: "Learn what CourseMind is testing for university students.",
};

export default function AboutPage() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#d7eadf] bg-[#edf8f2] px-3 py-1 text-sm font-medium text-[#21745f]">
          <BrainCircuit size={15} aria-hidden="true" />
          About CourseMind
        </p>
        <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
          A validation MVP for persistent course memory.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-8 text-[#5f5a50]">
          <p>
            CourseMind explores a simple question: do students want an AI tool that remembers an
            entire module rather than a single conversation?
          </p>
          <p>
            This MVP focuses on the core workflow. Students create a module, upload learning
            materials, and generate a living revision textbook with notes, connections, gaps,
            flashcards, and exam questions.
          </p>
          <p>
            There are no accounts, payments, databases, or sharing features. Browser storage keeps
            the product lightweight and quick to test.
          </p>
        </div>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#15251f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
          href="/dashboard"
        >
          Start building your course
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
