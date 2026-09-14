import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "S-Ex-ducation",
  description:
    "Éducation sexuelle et relationnelle pour la jeunesse haïtienne : contenu, formations, communauté.",
  openGraph: {
    title: "S-Ex-ducation",
    description:
      "Éducation sexuelle et relationnelle pour la jeunesse haïtienne : contenu, formations, communauté.",
    locale: "fr_HT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${fraunces.variable} ${workSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
