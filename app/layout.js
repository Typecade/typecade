import { JetBrains_Mono, Onest, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const px = Pixelify_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-pixel", display: "swap" });
const ui = Onest({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--f-code", display: "swap" });

export const metadata = {
  metadataBase: new URL(process.env.SITE ?? "https://typecade.app"),
  title: "Typecade: type a game, play it in a minute",
  description: "A games platform where one sentence becomes a playable game. Hold $TYPECADE to make games, like the best ones, and the day's most-liked game wins the prize pool. Every game is open source.",
  openGraph: { title: "Typecade", description: "Type a game. Play it in a minute.", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Typecade", description: "Type a game. Play it in a minute.", images: ["/og.png"] },
  icons: { icon: "/icon-64.png", apple: "/apple-touch-icon.png" },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0b0b0c" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${px.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
