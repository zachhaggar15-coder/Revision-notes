import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#fbfaf7]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#6f6b60] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>CourseMind is a validation MVP. Always verify generated material against your course sources.</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-4">
          <Link className="hover:text-[#171713]" href="/about">
            About
          </Link>
          <Link className="hover:text-[#171713]" href="/contact">
            Contact
          </Link>
          <Link className="hover:text-[#171713]" href="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-[#171713]" href="/terms">
            Terms
          </Link>
          <Link className="hover:text-[#171713]" href="/ai-disclaimer">
            AI disclaimer
          </Link>
        </nav>
      </div>
    </footer>
  );
}
