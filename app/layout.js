import { JetBrains_Mono, Onest, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const px = Pixelify_Sans({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--f-pixel", display: "swap" });
const ui = Onest({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--f-code", display: "swap" });

export const metadata = {
  metadataBase: new URL(process.env.SITE ?? "https://typecade.app"),
  title: "Typecade: type a game, get paid when people play it",
  description: "Type one sentence and an AI writes a playable game in about a minute. Every day the prize pool goes to the makers of the 10 most-liked games. Every game is open source.",
  openGraph: { title: "Typecade", description: "Type a game. Get paid when people play it.", images: ["/og.png"], type: "website" },
  twitter: { card: "summary_large_image", title: "Typecade", description: "Type a game. Get paid when people play it.", images: ["/og.png"] },
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
