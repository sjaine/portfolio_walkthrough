import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Jaine — Portfolio",
  description: "A short walkthrough of Jaine's work.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} h-full antialiased`}>
      <body className="h-full overflow-hidden font-sans">{children}</body>
    </html>
  );
}
