import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const seoTitle =
  "CourseMind - AI revision notes and personalised study guides for students";
const seoDescription =
  "Turn university lectures, notes, slides, and rough ideas into AI-generated revision notes, flashcards, exam questions, and a personalised course textbook.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seoTitle,
    template: "%s | CourseMind",
  },
  description: seoDescription,
  applicationName: "CourseMind",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "AI study tool",
    "AI revision notes",
    "university revision",
    "lecture notes",
    "exam questions",
    "flashcards",
    "personalised textbook",
    "student productivity",
  ],
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    images: [
      {
        alt: "CourseMind - AI revision notes and personalised study guides for students",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    url: siteUrl,
    siteName: "CourseMind",
    locale: "en_GB",
    type: "website",
  },
  robots: {
    follow: true,
    index: true,
  },
  verification: {
    google: "W_cXUFCxm-jIs-_khC6W-3zDO7EmXez-1_OzLdDa63c",
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
