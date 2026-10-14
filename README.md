# Typecade

Type one sentence. An AI writes a complete browser game while you watch, and you play it a minute later. Every game gets
its own page, makers get paid when their games get played and liked, and every game's code is published in
[Typecade/games](https://github.com/Typecade/games).

**[typecade.app](https://typecade.app)**

## How it works

1. You type an idea: *"Snake, but you're a pump.fun dev dodging rug pulls."*
2. The engine sends it to the model with one set of rules (`lib/prompt.js`): a single HTML file, touch controls for phones,
   a title screen, a score, a game-over screen, no network and no storage.
3. The code streams back while the model writes it (`app/api/build/route.js`). When it is complete, the game is saved and
   opens at `/play/<id>`.
4. The game runs in a locked sandbox (`app/g/[id]/route.js`): its own origin, no network, no forms, no pop-ups. A game can
   never send anything anywhere, so it can't be turned into a login or wallet page.
5. The file and the sentence it came from are committed to [Typecade/games](https://github.com/Typecade/games).

## Who pays

$TYPECADE, a coin on pump.fun. Its creator fees split on-chain through pump.fun's fee sharing, and the split shows on the
coin page:

- **15%** goes to the prize pool. Every day at 00:00 UTC the pool is shared among the makers of the 10 most-liked games.
  The share follows likes, and only $TYPECADE holders can like.
- **35%** goes to the AI tank, which pays the AI that writes the games. It holds SOL and buys AI credit only as games are
  made.
- **50%** goes to the developer.

Making games takes $TYPECADE worth 1 SOL in your wallet, and liking takes 0.1 SOL. The engine never spends more than a
fixed AI budget per day.

## Run it yourself

```bash
npm install
cp .env.example .env.local   # add an OpenRouter key
npm run dev                  # http://localhost:5380
```

Without Upstash (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) the dev server keeps games in memory.

## Layout

- `lib/prompt.js`: the engine's rules for every game.
- `app/api/build/route.js`: limits, the daily budget, streaming, saving and publishing.
- `app/g/[id]/route.js`: the sandbox a game runs in.
- `starter/`: the first games, written by the team, not by the engine. The site labels them that way.
- `worker/`: the tank wallet's fee payout (runs on our server).

MIT licensed.
