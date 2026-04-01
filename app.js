// Ergo Fortune Teller — app.js
// Uses Ergo Explorer public API for chain data, CoinGecko for price

const ERGO_EXPLORER = 'https://api.ergoplatform.com/api/v1';
const COINGECKO_PRICE = 'https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd&include_24hr_change=true';

let chainData = {};

// ── Star field ────────────────────────────────────────────────────────────────
(function buildStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      top:${Math.random()*100}%;
      left:${Math.random()*100}%;
      --dur:${(Math.random()*3+2).toFixed(1)}s;
    `;
    container.appendChild(s);
  }
})();

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchChainData() {
  const results = await Promise.allSettled([
    fetch(COINGECKO_PRICE).then(r => r.json()),
    fetch(`${ERGO_EXPLORER}/networkState`).then(r => r.json()),
  ]);

  const priceResult = results[0];
  const networkResult = results[1];

  chainData = {};

  if (priceResult.status === 'fulfilled') {
    chainData.price = priceResult.value?.ergo?.usd ?? null;
    chainData.change24h = priceResult.value?.ergo?.usd_24h_change ?? null;
  }

  if (networkResult.status === 'fulfilled') {
    chainData.blockHeight = networkResult.value?.height ?? null;
    chainData.difficulty = networkResult.value?.difficulty ?? null;
    chainData.hashrate = networkResult.value?.hashRate ?? null;
  }

  return chainData;
}

async function fetchWalletData(address) {
  if (!address || address.length < 10) return null;
  try {
    const r = await fetch(`${ERGO_EXPLORER}/addresses/${encodeURIComponent(address)}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function updateStats() {
  const price = chainData.price;
  const change = chainData.change24h;
  const height = chainData.blockHeight;

  document.getElementById('statPrice').textContent =
    price != null ? `$${price.toFixed(3)}` : 'N/A';

  document.getElementById('statBlock').textContent =
    height != null ? height.toLocaleString() : 'N/A';

  const phase = getDegenPhase(price, change, height);
  const phaseEl = document.getElementById('statPhase');
  phaseEl.textContent = phase.label;
  phaseEl.style.color = phase.color;
}

function getDegenPhase(price, change, height) {
  if (change == null) return { label: 'Unknown', color: '#94a3b8' };
  if (change > 10)  return { label: 'MOON 🚀', color: '#4ade80' };
  if (change > 3)   return { label: 'Bullish', color: '#86efac' };
  if (change > 0)   return { label: 'Cozy', color: '#fbbf24' };
  if (change > -3)  return { label: 'Sideways', color: '#94a3b8' };
  if (change > -10) return { label: 'Bearish', color: '#fca5a5' };
  return { label: 'REKT 🩸', color: '#f87171' };
}

// ── Fortune engine ────────────────────────────────────────────────────────────
const FORTUNES = {
  moon: [
    "The stars align in your favor. Green candles tower like ancient monuments — the Oracle sees abundance flowing into your wallet. HODL with conviction, for the chart breathes upward.",
    "The blockchain hums with euphoric energy. What you planted in the bear cave now blooms in the bull's field. The Oracle advises: take partial profits, lest the moon become the sun that blinds.",
    "A great surge of on-chain activity signals awakening. The degen inside you knew — this is the moment the normies missed. The Oracle whispers: the next leg up is just beginning.",
  ],
  bull: [
    "The Oracle reads warmth in the chain — a steady, quiet bull breathes here. Do not rush. The harvest comes to those who plant carefully and wait for the on-chain tide to rise.",
    "Positive omens gather like blocks in a new epoch. The difficulty has spoken: miners believe. When miners believe, believers become rich. The Oracle says: accumulate with patience.",
    "Green energy flows through the merkle roots. The Oracle senses a builder season — those who contribute, ship, and build now will reap in the next euphoria cycle.",
  ],
  sideways: [
    "The Oracle sees a coiling serpent — neither rising nor falling, but gathering energy. Patience is the rarest form of degen wisdom. The breakout will surprise those who looked away.",
    "The chain moves like still water. Do not mistake stillness for stagnation — beneath the surface, liquidity accumulates. The Oracle advises: use this time to sharpen your thesis.",
    "The blockchain rests, and so should you. The Oracle reads this as the calm between storms. Position wisely before the wind speaks again.",
  ],
  bear: [
    "The Oracle perceives red mist in the crystal. But remember: bear markets build legends. The degen who accumulates in darkness holds diamonds when light returns.",
    "Difficult tides move through the on-chain waters. The Oracle cautions: protect what you have, for the floor is not yet revealed. Stack sats, lower your average, and endure.",
    "Heavy blocks weigh on the network's spirit. But the Oracle has seen many winters end. Spring is always built on the bones of the bear. This too shall pass.",
  ],
  rekt: [
    "The Oracle recoils from the deep red abyss. Yet even in total devastation, the chain persists — blocks still form, proof-of-work still sings. The degen's final virtue is survival.",
    "A storm of blood-colored candles fills the oracle's vision. The Oracle speaks plainly: this is not the time to leverage. This is the time to breathe, to wait, to live to degen another day.",
    "Maximum pain walks these chain-streets tonight. But the Oracle has read this page before — every capitulation event has been followed by a renaissance. Buy the fear if your soul allows.",
  ],
  wallet_rich: [
    "Your wallet speaks of past wisdom. The Oracle sees accumulated treasure — a builder's reward, a diamond hand's prize. Guard it well, for the chain remembers all.",
  ],
  wallet_empty: [
    "Your wallet is light as morning air — but every legend began with an empty bag. The Oracle sees potential energy, waiting for the spark of the right entry.",
  ],
  wallet_mid: [
    "Your wallet holds a balanced sum — neither reckless nor timid. The Oracle reads this as the mark of a thoughtful degen. Continue this path with eyes open.",
  ],
};

function pickFortune(category) {
  const arr = FORTUNES[category] || FORTUNES.sideways;
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildFortune(wallet) {
  const { price, change24h, blockHeight, difficulty } = chainData;

  // Determine sentiment
  let sentiment;
  if (change24h == null) sentiment = 'sideways';
  else if (change24h > 10) sentiment = 'moon';
  else if (change24h > 3)  sentiment = 'bull';
  else if (change24h > -3) sentiment = 'sideways';
  else if (change24h > -10) sentiment = 'bear';
  else sentiment = 'rekt';

  // Main fortune
  let mainText = pickFortune(sentiment);

  // Wallet addendum
  let walletAddendum = '';
  if (wallet) {
    const bal = wallet.confirmedBalance ?? 0;
    const ergBalance = bal / 1e9; // nanoERG to ERG
    if (ergBalance > 1000) walletAddendum = ' ' + pickFortune('wallet_rich');
    else if (ergBalance < 1) walletAddendum = ' ' + pickFortune('wallet_empty');
    else walletAddendum = ' ' + pickFortune('wallet_mid');
  }

  // Block height numerology
  let blockOmen = '';
  if (blockHeight) {
    const lastDigit = blockHeight % 10;
    const blockOmens = {
      0: 'A round block — cycles complete.',
      1: 'The chain begins anew.',
      3: 'The trinity of blocks aligns.',
      7: 'Seven — the number of fortune.',
      8: 'Eight — infinite cycles of abundance.',
      9: 'The last digit before rebirth.',
    };
    blockOmen = blockOmens[lastDigit] || 'The blocks count forward.';
  }

  // Difficulty reading
  let diffReading = '';
  if (difficulty) {
    const diffT = difficulty / 1e15; // PH
    if (diffT > 2)   diffReading = 'Miner conviction is STRONG.';
    else if (diffT > 1) diffReading = 'Miner conviction holds steady.';
    else diffReading = 'Miners are cautious.';
  }

  const aspects = buildAspects(price, change24h, blockHeight, difficulty, wallet);

  return {
    text: mainText + walletAddendum,
    blockOmen,
    diffReading,
    aspects,
    sentiment,
    walletBalance: wallet ? (wallet.confirmedBalance ?? 0) / 1e9 : null,
  };
}

function buildAspects(price, change24h, blockHeight, difficulty, wallet) {
  const aspects = [];

  aspects.push({
    icon: change24h > 0 ? '📈' : (change24h < 0 ? '📉' : '➡️'),
    label: '24h Change',
    value: change24h != null ? `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%` : 'N/A',
    cls: change24h > 0 ? 'bull' : (change24h < 0 ? 'bear' : 'neutral'),
  });

  aspects.push({
    icon: '⛏️',
    label: 'Block Height',
    value: blockHeight != null ? `#${blockHeight.toLocaleString()}` : 'N/A',
    cls: 'neutral',
  });

  if (wallet) {
    const bal = (wallet.confirmedBalance ?? 0) / 1e9;
    aspects.push({
      icon: '💎',
      label: 'Your ERG',
      value: bal.toFixed(2),
      cls: bal > 100 ? 'bull' : 'neutral',
    });
  } else {
    const diffT = difficulty ? (difficulty / 1e15).toFixed(2) : null;
    aspects.push({
      icon: '🔥',
      label: 'Difficulty',
      value: diffT ? `${diffT} PH` : 'N/A',
      cls: 'neutral',
    });
  }

  return aspects;
}

const TITLES = {
  moon: ['The MOON Prophecy', 'Bull Ascension Foretold', 'Green Destiny Revealed'],
  bull: ['A Favorable Reading', 'The Bull Stirs', 'Gentle Gains Await'],
  sideways: ['The Coiling Oracle Speaks', 'Patience is Power', 'The Calm Before Wick'],
  bear: ['The Bear\'s Warning', 'Dark Candles Ahead', 'The Oracle Cautions'],
  rekt: ['Maximum Pain Prophecy', 'The Oracle Weeps Red', 'Survival Foretold'],
};
const ICONS = {
  moon: '🚀', bull: '🐂', sideways: '🌀', bear: '🐻', rekt: '🩸',
};
const RUNES = {
  moon: '🌕', bull: '⬆', sideways: '◈', bear: '⬇', rekt: '💀',
};

// ── Main action ───────────────────────────────────────────────────────────────
async function readFortune() {
  const btn = document.getElementById('readBtn');
  const orb = document.querySelector('.orb');
  const orbRune = document.getElementById('orbRune');

  btn.disabled = true;
  orb.classList.add('loading');
  orbRune.textContent = '⟳';

  try {
    await fetchChainData();
    updateStats();

    const walletInput = document.getElementById('walletInput').value.trim();
    const wallet = walletInput ? await fetchWalletData(walletInput) : null;

    const fortune = buildFortune(wallet);

    // Update orb rune
    orb.classList.remove('loading');
    orbRune.textContent = RUNES[fortune.sentiment] || '⬡';

    renderFortune(fortune);
  } catch (err) {
    orb.classList.remove('loading');
    orbRune.textContent = '⬡';
    renderError();
  } finally {
    btn.disabled = false;
  }
}

function renderFortune(fortune) {
  const display = document.getElementById('fortuneDisplay');
  const oracleCard = document.querySelector('.oracle-card');

  // Titles and icon
  const titles = TITLES[fortune.sentiment] || TITLES.sideways;
  document.getElementById('fortuneTitle').textContent =
    titles[Math.floor(Math.random() * titles.length)];
  document.getElementById('fortuneIcon').textContent =
    ICONS[fortune.sentiment] || '✨';

  // Main text
  document.getElementById('fortuneText').textContent = fortune.text;

  // Aspect cards
  const cardsEl = document.getElementById('fortuneCards');
  cardsEl.innerHTML = fortune.aspects.map(a => `
    <div class="fcard">
      <span class="fcard-icon">${a.icon}</span>
      <span class="fcard-label">${a.label}</span>
      <span class="fcard-value ${a.cls}">${a.value}</span>
    </div>
  `).join('');

  // Warning / addendum
  const warnings = [];
  if (fortune.blockOmen) warnings.push(fortune.blockOmen);
  if (fortune.diffReading) warnings.push(fortune.diffReading);
  warnings.push('This reading is for entertainment only. Not financial advice.');
  document.getElementById('fortuneWarning').textContent = warnings.join(' · ');

  // Show
  oracleCard.style.display = 'none';
  display.style.display = 'flex';
  display.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderError() {
  const display = document.getElementById('fortuneDisplay');
  const oracleCard = document.querySelector('.oracle-card');

  document.getElementById('fortuneTitle').textContent = 'The Oracle Is Clouded';
  document.getElementById('fortuneIcon').textContent = '🌫️';
  document.getElementById('fortuneText').textContent =
    'The blockchain spirits are silent. The Oracle cannot read the chain at this moment. Perhaps the network sleeps — try again, degen.';
  document.getElementById('fortuneCards').innerHTML = '';
  document.getElementById('fortuneWarning').textContent = 'API unreachable. Check your connection.';

  oracleCard.style.display = 'none';
  display.style.display = 'flex';
}

function resetFortune() {
  const display = document.getElementById('fortuneDisplay');
  const oracleCard = document.querySelector('.oracle-card');
  const orbRune = document.getElementById('orbRune');

  display.style.display = 'none';
  oracleCard.style.display = 'flex';
  orbRune.textContent = '⬡';
  oracleCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Init: pre-load chain data silently ───────────────────────────────────────
fetchChainData().then(updateStats).catch(() => {});
