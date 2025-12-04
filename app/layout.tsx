import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "H2 DNA Spectrum | Instinct-Based Personality Assessment",
  description: "Discover your natural behavioral patterns through the H2 DNA Spectrum assessment - a sophisticated alternative to Myers-Briggs for coaches and consultants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
