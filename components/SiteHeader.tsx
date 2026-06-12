import Link from "next/link";
import { BookOpenText, Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#fbfaf7]/82 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#15251f] text-white shadow-sm">
            <BookOpenText size={19} aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-[#171713]">CourseMind</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#5c574d] md:flex">
          <Link className="transition hover:text-[#171713]" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition hover:text-[#171713]" href="/about">
            About
          </Link>
          <Link className="transition hover:text-[#171713]" href="/privacy">
            Privacy
          </Link>
          <Link className="transition hover:text-[#171713]" href="/ai-disclaimer">
            AI disclaimer
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-[#15251f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#223b32]"
        >
          <Sparkles size={16} aria-hidden="true" />
          Start
        </Link>
      </nav>
    </header>
  );
}
