import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using the CourseMind MVP.",
};

export default function TermsPage() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase text-[#176b58]">Terms of Service</p>
        <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
          Use CourseMind as a study aid, not an official source of truth.
        </h1>
        <div className="mt-8 space-y-7 text-base leading-8 text-[#5f5a50]">
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">MVP status</h2>
            <p className="mt-3">
              CourseMind is a validation MVP. Features may change, limits may be adjusted, and local
              browser data may be lost if you clear site storage or change devices.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Student responsibility</h2>
            <p className="mt-3">
              You are responsible for checking generated study materials against official course
              materials, lecture slides, reading lists, and university guidance before relying on
              them for coursework, revision, or exams.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Acceptable use</h2>
            <p className="mt-3">
              Do not use CourseMind to upload content you do not have permission to process, to
              generate academic misconduct, to bypass university rules, or to submit AI output as
              your own assessed work where that is prohibited.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Service limits</h2>
            <p className="mt-3">
              The app includes rate limits, file limits, and note-length limits to protect the MVP
              from abuse and keep the public demo stable.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">No warranty</h2>
            <p className="mt-3">
              CourseMind is provided as-is for evaluation. AI-generated material may be incomplete,
              incorrect, or unsuitable for a particular course.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
