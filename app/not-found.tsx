import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <section className="px-5 py-20 sm:px-6 lg:px-8">
      <div className="surface mx-auto max-w-2xl rounded-lg p-10 text-center">
        <p className="text-sm font-semibold text-[#21745f]">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#171713]">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-[#6f6b60]">
          This CourseMind page does not exist yet.
        </p>
        <Link
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#15251f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
          href="/"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back home
        </Link>
      </div>
    </section>
  );
}
