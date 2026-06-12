import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseDashboard } from "@/components/CourseDashboard";

export const metadata: Metadata = {
  title: "Module Dashboard",
  description: "Create modules, upload materials, and manage CourseMind course memory.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <CourseDashboard />
    </Suspense>
  );
}

function DashboardFallback() {
  return (
    <section className="min-h-screen px-5 py-10 sm:px-6 lg:px-8">
      <div className="surface mx-auto max-w-5xl rounded-lg p-10 text-center">
        <p className="text-sm font-semibold text-[#21745f]">Loading CourseMind</p>
      </div>
    </section>
  );
}
