import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "AWS S3 Image Gallery | Nanakumor Princewill",
  description:
    "A secure AWS S3 image gallery with password-protected uploads, image previews, pagination, and signed downloads, built by Nanakumor Princewill.",
  applicationName: "AWS S3 Image Gallery",
  authors: [
    {
      name: "Nanakumor Princewill",
      url: "https://princewillnanakumor.com/",
    },
  ],
  creator: "Nanakumor Princewill",
  publisher: "Nanakumor Princewill",
  keywords: [
    "AWS S3",
    "image upload",
    "image gallery",
    "Next.js",
    "React",
    "TypeScript",
    "Princewill Nanakumor",
  ],
  category: "technology",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "AWS S3 Image Gallery",
    description:
      "Secure, password-protected image uploads and a public AWS S3 gallery built with Next.js.",
    siteName: "AWS S3 Image Gallery",
  },
  twitter: {
    card: "summary",
    title: "AWS S3 Image Gallery",
    description:
      "Secure AWS S3 image uploads and gallery built by Nanakumor Princewill.",
  },
  other: {
    portfolio: "https://princewillnanakumor.com/",
    "project-page":
      "https://princewillnanakumor.com/projects/aws-s3bucket-image-upload-app",
    "related-article":
      "https://princewillnanakumor.com/blog/building-a-production-ready-aws-s3-image-upload-system-with-next-js-16-and-typescript",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
