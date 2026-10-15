// The launch wallets, on every page (Phillip, 2026-10-15): the developer wallet that creates $TYPECADE and the team wallets
// that buy at launch, written out in full so anyone can look them up. Kestrel checks the coin's website for these
// addresses before it launches. The list is TEAM_WALLETS (Vercel), the same list that keeps them out of the prize pool.
import { TEAM_WALLETS } from "../lib/config.js";

export default function Disclosure() {
  const wallets = [...TEAM_WALLETS];
  if (!wallets.length) return null;
  // small print at the very bottom, no heading: the addresses only have to be public and complete, not loud
  return (
    <p className="disclose">
      Disclosed launch wallets: at launch the creator buys $TYPECADE with the developer wallet that creates the coin and with these team wallets, any of which may sell at any time and none of which can win the prize pool.{" "}
      {wallets.map((w, i) => <span key={w}><a href={`https://solscan.io/account/${w}`} target="_blank" rel="noopener">{w}</a>{i < wallets.length - 1 ? ", " : "."}</span>)}
    </p>
  );
}
