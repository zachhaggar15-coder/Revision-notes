import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CourseMind stores module data, analytics, uploads, and AI provider requests.",
};

export default function PrivacyPage() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-semibold uppercase text-[#176b58]">Privacy Policy</p>
        <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
          CourseMind keeps the MVP lightweight and local-first.
        </h1>
        <div className="mt-8 space-y-7 text-base leading-8 text-[#5f5a50]">
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">What is stored locally</h2>
            <p className="mt-3">
              Course modules, uploaded material text, generated textbooks, local analytics counters,
              and feedback are stored in your browser local storage. Clearing browser data may remove
              this information.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">What is sent to AI providers</h2>
            <p className="mt-3">
              When AI generation or image extraction is used, your module content or uploaded image
              content is sent from the server to the configured AI provider. API keys are read only
              from server-side environment variables and are never exposed to the browser.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Analytics</h2>
            <p className="mt-3">
              CourseMind uses Vercel Analytics and Speed Insights to understand page visits,
              high-level product usage, repeat sessions, and performance. Custom analytics events do
              not include pasted notes, uploaded content, or generated textbooks.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">Sensitive information</h2>
            <p className="mt-3">
              Do not upload sensitive personal data, confidential research, copyrighted course packs,
              patient information, or private university materials unless you have permission and are
              comfortable with the configured AI provider processing that content.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-[#171713]">No accounts or payments</h2>
            <p className="mt-3">
              This MVP does not include user accounts, authentication, payments, databases, or social
              features.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
