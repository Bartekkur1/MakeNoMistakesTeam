import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Unbounded } from "next/font/google";
import "./globals.css";

// Headings: Unbounded (wide, blocky, matches the mascot). Body: Atkinson Hyperlegible Next.
const display = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

const body = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "BezpiecznaAura: cyberpomocnik dla dzieci",
  description:
    "Scamerino pomaga dzieciom w wieku 10-13 lat rozpoznać oszustwo w grze, na Discordzie, w mailu i SMS-ie oraz łatwo poprosić rodzica o pomoc.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
