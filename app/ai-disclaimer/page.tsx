import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Disclaimer",
  description: "Important guidance for checking CourseMind AI-generated revision materials.",
};

export default function AiDisclaimerPage() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase text-[#176b58]">AI Disclaimer</p>
        <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
          Always verify AI-generated notes against official course materials.
        </h1>
        <div className="mt-8 space-y-7 text-base leading-8 text-[#5f5a50]">
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">AI can be wrong</h2>
            <p className="mt-3">
              CourseMind is designed to organise and explain your notes, but AI systems can
              misunderstand context, omit details, or produce confident-sounding mistakes.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Use official sources first</h2>
            <p className="mt-3">
              Check generated revision materials against lecture slides, seminar notes, textbook
              chapters, assessment rubrics, and guidance from your university or teaching team.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Academic integrity</h2>
            <p className="mt-3">
              Use CourseMind to support learning and revision. Follow your university&apos;s AI and
              academic-integrity policies for coursework, exams, lab reports, and assessed work.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Uncertainty labels</h2>
            <p className="mt-3">
              When CourseMind labels missing context or uncertainty, treat that as a prompt to
              revisit your source materials rather than as a final answer.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
