import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "EDI Badge Generator",
  description: "Create and mint NFT badges on Polygon — EDI Challenge 2026",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans antialiased bg-white text-elca-dark`}>
        {children}
      </body>
    </html>
  );
}
