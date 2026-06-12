import type { Metadata } from "next";
import { Suspense } from "react";
import { TextbookWorkspace } from "@/components/TextbookWorkspace";

export const metadata: Metadata = {
  title: "AI Textbook",
  description: "Generate and review an evolving CourseMind textbook from module memory.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function TextbookPage() {
  return (
    <Suspense fallback={<TextbookFallback />}>
      <TextbookWorkspace />
    </Suspense>
  );
}

function TextbookFallback() {
  return (
    <section className="min-h-screen px-5 py-10 sm:px-6 lg:px-8">
      <div className="surface mx-auto max-w-5xl rounded-lg p-10 text-center">
        <p className="text-sm font-semibold text-[#21745f]">Loading textbook</p>
      </div>
    </section>
  );
}
