import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the CourseMind MVP team.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@coursemind.app";

  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="surface mx-auto max-w-4xl rounded-lg p-8">
        <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#d7eadf] bg-[#edf8f2] px-3 py-1 text-sm font-medium text-[#21745f]">
          <Mail size={15} aria-hidden="true" />
          Contact
        </p>
        <h1 className="text-4xl font-semibold text-[#171713] sm:text-5xl">
          Want to test CourseMind with a real module?
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a50]">
          Send feedback, bug reports, or early access questions by email. The MVP avoids contact
          forms so the public site can launch without accounts, database writes, or spam handling.
        </p>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#15251f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
          href={`mailto:${contactEmail}`}
        >
          {contactEmail}
        </Link>
      </div>
    </section>
  );
}
