"use client";
// The visitor's account: which wallet is signed in and what its $TYPECADE allows. One shared store for every component
// (nav button, create panel, like buttons); sign-in is the wallet's own Sign In With Solana (components/wallet.js).
import bs58 from "bs58";
import { useEffect, useSyncExternalStore } from "react";
import { availableWallets, canSignIn, connect, disconnect, listenForWallets, signIn } from "./wallet.js";

let state = { me: null, wallets: [], busy: false, error: null, picking: false };
const subs = new Set();
const set = (patch) => { state = { ...state, ...patch }; subs.forEach((f) => f()); };
const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };

let loaded = false;
export async function refresh(fresh = false) {
  try {
    const me = await fetch(`/api/me${fresh ? "?fresh=1" : ""}`, { cache: "no-store" }).then((r) => r.json());
    set({ me });
  } catch {}
}

export async function signInWith(name) {
  set({ busy: true, error: null });
  try {
    const address = await connect(name);
    if (!canSignIn()) throw new Error(`${name} has no Sign In With Solana. Use Phantom, Solflare or Backpack.`);
    const n = await fetch(`/api/auth/nonce?wallet=${address}`).then((r) => r.json());
    if (n.error) throw new Error(n.error);
    const s = await signIn({ nonce: n.nonce, issuedAt: n.issuedAt });
    if (s.address !== address) throw new Error("The wallet signed with a different account.");
    let bin = "";
    s.signedMessage.forEach((b) => (bin += String.fromCharCode(b)));
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet: address, nonce: n.nonce, signature: bs58.encode(s.signature), signedMessage: btoa(bin) }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Sign-in failed.");
    set({ picking: false });
    await refresh(true);
  } catch (e) {
    set({ error: /reject|denied|cancel/i.test(e.message) ? "Sign-in was cancelled in the wallet." : e.message });
  } finally {
    set({ busy: false });
  }
}
export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  await disconnect().catch(() => {});
  set({ me: { ...state.me, wallet: null, hold: null } });
}
export const openPicker = (open = true) => set({ picking: open, error: null });

export function useAccount() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    refresh();
    listenForWallets(() => set({ wallets: availableWallets() }));
    set({ wallets: availableWallets() });
  }, []);
  return s;
}
export const short = (w) => (w ? `${w.slice(0, 4)}…${w.slice(-4)}` : "");
