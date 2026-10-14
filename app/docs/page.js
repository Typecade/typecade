import { Footer, Nav, WalletPicker } from "../../components/Chrome.js";
import { AI_TANK, GAMES_REPO, HOLDER_MIN_SOL, LIKE_MIN_SOL, LIMITS, MIN_WIN_LIKES, MODEL, POOL, SOURCE_REPO, TRANSFER_WAIT_H } from "../../lib/config.js";
import { gameMint } from "../../lib/holding.js";
import { PRIZE_SLOTS } from "../../lib/likes.js";

export const dynamic = "force-dynamic";
export const metadata = { title: "Docs · Typecade", description: "How Typecade works: making games, likes, the daily prize pool, $TYPECADE's fee split, sealed games and open source." };

const TOC = [["what", "What Typecade is"], ["make", "Make a game"], ["play", "Play and share"], ["likes", "Likes"], ["paid", "Get paid"], ["coin", "$TYPECADE"], ["safety", "Sealed games"], ["open", "Open source"], ["faq", "FAQ"], ["risk", "Risks"]];

export default async function Docs() {
  const mint = await gameMint().catch(() => null);
  const links = { source: `https://github.com/${SOURCE_REPO}`, games: `https://github.com/${GAMES_REPO}`, x: process.env.X_URL ?? "https://x.com/typecadeapp" };
  return (
    <>
      <WalletPicker />
      <Nav mint={mint} links={links} />
      <main className="docs">
        <aside className="docs-toc" aria-label="On this page">
          <ol>{TOC.map(([id, t]) => <li key={id}><a href={`#${id}`}>{t}</a></li>)}</ol>
        </aside>
        <article className="docs-body">
          <h1>DOCS</h1>
          <p className="lede">Everything Typecade does, and every rule it plays by, on one page.</p>

          <section id="what"><h2>What Typecade is</h2>
            <p>Typecade is a games platform where one sentence becomes a game. You type an idea, an AI writes a complete browser game while you watch, and a minute later it has its own page that anyone can play.</p>
            <p>The games that people like most earn their makers money from the daily prize pool, which $TYPECADE's creator fees fill.</p>
          </section>

          <section id="make"><h2>Make a game</h2>
            <ol>
              <li>Connect a Solana wallet and sign in. Signing in is one message; it costs nothing and sends no transaction.</li>
              <li>Hold $TYPECADE worth at least <strong>{HOLDER_MIN_SOL} SOL</strong> in that wallet.</li>
              <li>Type your game in one sentence (up to {LIMITS.promptMax} characters), in any language, and press Make my game.</li>
            </ol>
            <p>The engine sends your sentence to the model ({MODEL.id.split("/").pop()}) with one set of rules: one HTML file, touch controls for phones, a title screen, a score, a game-over screen, no network and no storage. The code streams to you as it is written. When it is complete, the game is saved, gets its page at <code>/play/&lt;id&gt;</code>, and is published to GitHub.</p>
            <p><strong>Limits.</strong> {LIMITS.perWalletDay} games per wallet per UTC day. The engine's whole AI budget is {LIMITS.globalUsdDay} USD a day; when it is used up, making games pauses until 00:00 UTC and the site says so.</p>
            <p><strong>Not allowed.</strong> Login, wallet or payment pages, copies of real websites, sexual content, hate, cruelty to real people. Such requests are refused before or by the model, and a refused or broken game does not count against your day.</p>
          </section>

          <section id="play"><h2>Play and share</h2>
            <p>Every game has its own page with a cover, a Play button, the sentence it came from, its maker, its likes and plays, and its rank today. Anyone can play, no wallet needed. Share the page link on X or anywhere; the link opens straight into the game.</p>
          </section>

          <section id="likes"><h2>Likes</h2>
            <ul>
              <li>Liking takes a signed-in wallet holding $TYPECADE worth <strong>{LIKE_MIN_SOL} SOL</strong>.</li>
              <li>One like per wallet per game. Nobody can like their own game.</li>
              <li>$TYPECADE you bought counts at once. $TYPECADE that arrived by plain transfer counts after {TRANSFER_WAIT_H} hours, so one bag passed between wallets cannot like a game many times a day.</li>
            </ul>
          </section>

          <section id="paid"><h2>Get paid</h2>
            <p>15% of $TYPECADE's creator fees go into the prize pool wallet <a className="mono" href={`https://solscan.io/account/${POOL}`} target="_blank" rel="noopener">{POOL}</a>. Every day at 00:00 UTC the pool (all but a 0.02 SOL reserve for fees) is shared among the makers of the day's <strong>{PRIZE_SLOTS} most-liked games</strong>, in proportion to the likes each game got that day.</p>
            <ul>
              <li>A game needs at least {MIN_WIN_LIKES} likes that day to earn. The team never earns from the pool: neither the starter games nor any game made with the team and developer wallets listed in the coin description.</li>
              <li>A maker with several games in the top {PRIZE_SLOTS} gets the sum, in one transfer.</li>
              <li>No game with enough likes means the pool rolls over to the next day.</li>
              <li>Every payout is one on-chain transaction, linked on the leaderboard.</li>
            </ul>
            <p>Example: the pool holds 1.02 SOL and three games made the cut with 30, 20 and 10 likes. They get 0.5, 0.333 and 0.167 SOL.</p>
          </section>

          <section id="coin"><h2>$TYPECADE</h2>
            <p>$TYPECADE is a coin on pump.fun{mint ? <>: <code>{mint}</code></> : ". It launches soon; its CA appears here and on the home page the moment it is live"}. Its creator fees are split on-chain with pump.fun's fee sharing, which shows the split on the coin page:</p>
            <ul>
              <li><strong>15%</strong> to the prize pool, paid out daily to makers as above.</li>
              <li><strong>35%</strong> to the AI tank <a className="mono" href={`https://solscan.io/account/${AI_TANK}`} target="_blank" rel="noopener">{AI_TANK}</a>, which pays the AI that writes the games.</li>
              <li><strong>50%</strong> to the developer, who runs the servers and builds Typecade.</li>
            </ul>
            <p><strong>No waste.</strong> The AI tank keeps its SOL and buys AI credit only as games are made, so nothing piles up as prepaid credit nobody uses. The daily AI budget still caps what one day can spend.</p>
            <p><strong>If Typecade ever closes,</strong> whatever is left in the AI tank goes to the developer. The prize pool is paid out to makers as usual until then.</p>
          </section>

          <section id="safety"><h2>Sealed games</h2>
            <p>Every game runs in a locked sandbox on its own origin: no network, no forms, no pop-ups, no storage, no access to this site's cookies. A game cannot send anything anywhere, so it cannot be turned into a login page or a wallet drainer, even if someone tries. No game ever asks for your wallet.</p>
          </section>

          <section id="open"><h2>Open source</h2>
            <p>Every game's code and the sentence it came from are committed to <a href={links.games} target="_blank" rel="noopener">{GAMES_REPO}</a> the moment it is made. The code of this site, the engine's rules and the payout worker are in <a href={links.source} target="_blank" rel="noopener">{SOURCE_REPO}</a>. Both are MIT licensed.</p>
          </section>

          <section id="faq"><h2>FAQ</h2>
            <dl className="faq">
              <dt>Who owns a game I make?</dt><dd>It is public and MIT licensed, like everything here. Anyone may play it, fork it and build on it.</dd>
              <dt>Can I edit my game?</dt><dd>Not on Typecade yet. Type a new sentence for a new version, or fork its code on GitHub.</dd>
              <dt>Does it work on phones?</dt><dd>Yes. Every game is written with touch controls, and the site is built for phones first.</dd>
              <dt>My game came out broken.</dt><dd>It happens sometimes. A game that comes out incomplete does not count against your day; try again, or say it more simply.</dd>
              <dt>Why do I need $TYPECADE to make games?</dt><dd>Every game costs real AI money. Holding keeps the engine for people who are in, and $TYPECADE's fees are what pay the AI and the makers.</dd>
              <dt>Where does the AI money go if nobody makes games?</dt><dd>It stays as SOL in the AI tank. Credit is bought only as games are made. If Typecade closes, what is left goes to the developer.</dd>
            </dl>
          </section>

          <section id="risk"><h2>Risks</h2>
            <p>$TYPECADE is a memecoin. Nobody promises it any value, the prize pool can be small or empty, and you can lose what you put in. Only buy what you can afford to lose.</p>
          </section>
        </article>
      </main>
      <Footer mint={mint} links={links} />
    </>
  );
}
