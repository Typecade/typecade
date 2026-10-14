// Browser wallets through the Wallet Standard (Phantom, Solflare, Backpack and every wallet that registers itself).
// Typecade asks the wallet for one thing only: its Sign In With Solana, which logs the account in. It never sends a transaction.

const found = new Map();
const listeners = new Set();
const api = Object.freeze({
  register: (...ws) => {
    for (const w of ws) {
      const ok = w.chains.some((c) => c.startsWith("solana:")) && "solana:signTransaction" in w.features && "standard:connect" in w.features;
      if (ok) found.set(w.name, w);
    }
    listeners.forEach((l) => l());
    return () => {};
  },
});

let started = false;
export function listenForWallets(onChange) {
  listeners.add(onChange);
  if (started) return;
  started = true;
  window.addEventListener("wallet-standard:register-wallet", ((e) => {
    try {
      e.detail(api);
    } catch {
      /* a wallet that throws while registering is skipped */
    }
  }));
  window.dispatchEvent(new CustomEvent("wallet-standard:app-ready", { detail: api }));
}

export const availableWallets = () => [...found.values()].map((w) => ({ name: w.name, icon: w.icon }));

let current = null;
const LAST = "typeagame:wallet";
export const connected = () => (current ? { name: current.wallet.name, address: current.account.address } : null);
export function lastWallet() {
  try {
    return localStorage.getItem(LAST);
  } catch {
    return null;
  }
}

export async function connect(name, silent = false) {
  const wallet = found.get(name);
  if (!wallet) throw new Error(`${name} isn't installed in this browser.`);
  const res = await wallet.features["standard:connect"].connect(silent ? { silent: true } : undefined);
  const account = (res?.accounts ?? wallet.accounts)[0];
  if (!account) throw new Error(`${name} didn't share an account.`);
  current = { wallet, account };
  try {
    localStorage.setItem(LAST, name);
  } catch {
    /* storage blocked */
  }
  wallet.features["standard:events"]?.on?.("change", () => {
    if (current?.wallet !== wallet) return;
    const next = wallet.accounts[0];
    current = next ? { wallet, account: next } : null;
    listeners.forEach((l) => l());
  });
  return account.address;
}

export async function disconnect() {
  const w = current?.wallet;
  current = null;
  try {
    localStorage.removeItem(LAST);
  } catch {
    /* storage blocked */
  }
  await w?.features["standard:disconnect"]?.disconnect?.();
}

// Sign In With Solana through the wallet itself, when it offers it: the wallet writes the message and refuses to sign for a
// page whose address does not match the domain, so a look-alike site cannot collect a sign-in for typecade.app.
export const canSignIn = () => Boolean(current?.wallet.features["solana:signIn"]);
export async function signIn({ nonce, issuedAt }) {
  const f = current?.wallet.features["solana:signIn"];
  if (!f) throw new Error("This wallet has no Sign In With Solana.");
  const [out] = await f.signIn({ domain: window.location.host, address: current.account.address, statement: "Sign in to Typecade. This costs nothing and sends no transaction.", nonce, issuedAt });
  return { signedMessage: out.signedMessage, signature: out.signature, address: out.account?.address ?? current.account.address };
}

export async function signText(text) {
  if (!current) throw new Error("Connect a wallet first.");
  const [out] = await current.wallet.features["solana:signMessage"].signMessage({ account: current.account, message: new TextEncoder().encode(text) });
  return out.signature;
}

export async function signTx(bytes) {
  if (!current) throw new Error("Connect a wallet first.");
  const [out] = await current.wallet.features["solana:signTransaction"].signTransaction({ account: current.account, transaction: bytes, chain: "solana:mainnet" });
  return out.signedTransaction;
}

// several transactions in one approval (Wallet Standard takes them together); a wallet that answers with fewer is asked for
// the rest one by one
export async function signTxs(list) {
  if (!current) throw new Error("Connect a wallet first.");
  const { account, wallet } = current;
  const sign = wallet.features["solana:signTransaction"].signTransaction;
  const out = (await sign(...list.map((transaction) => ({ account, transaction, chain: "solana:mainnet" })))).map((o) => o.signedTransaction);
  for (let i = out.length; i < list.length; i++) out.push((await sign({ account, transaction: list[i], chain: "solana:mainnet" }))[0].signedTransaction);
  return out;
}
