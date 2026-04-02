# Ergo Fortune Teller

## Live Demo

**[https://ad-ergo-fortune-teller-1775098093657.vercel.app](https://ad-ergo-fortune-teller-1775098093657.vercel.app)**

A mystical fortune teller powered by live Ergo blockchain data and ERG price feeds.

## What it does

- Fetches live ERG price and 24h change from CoinGecko
- Reads current Ergo network state (block height, difficulty, supply) from Ergo Explorer API
- Uses on-chain data as entropy to generate a unique fortune each visit
- Animated starfield UI

## Usage

Open `index.html` in any browser — no build step, no dependencies.

Or visit the live version on [Degens.World](https://degens.world).

## Tech

Pure HTML / CSS / JS. Data sources: [Ergo Explorer API](https://api.ergoplatform.com) + [CoinGecko](https://coingecko.com). Zero server-side code.
