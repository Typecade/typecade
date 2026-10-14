// Any address that is not a page: the arcade's game-over screen, with the way back.
import { Footer, Nav, WalletPicker } from "../components/Chrome.js";
import { GAMES_REPO, SOURCE_REPO } from "../lib/config.js";
import { gameMint } from "../lib/holding.js";

export const metadata = { title: "Game over · Typecade" };

export default async function NotFound() {
  const mint = await gameMint().catch(() => null);
  const links = { source: `https://github.com/${SOURCE_REPO}`, games: `https://github.com/${GAMES_REPO}`, x: process.env.X_URL ?? "https://x.com/typecadeapp" };
  return (
    <>
      <WalletPicker />
      <Nav mint={mint} links={links} />
      <main className="lost">
        <h1>GAME<br />OVER.</h1>
        <p>There is no page at this address. If someone sent you a game link, it may have been cut off.</p>
        <div className="lost-actions"><a className="btn-solid" href="/">PLAY AGAIN</a><a className="btn-line" href="/#games">ALL GAMES</a></div>
      </main>
      <Footer mint={mint} links={links} />
    </>
  );
}
