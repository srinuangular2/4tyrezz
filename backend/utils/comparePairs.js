const { num, sameBudgetBucket } = require('./priceBuckets');

const MAX_PRICE_RATIO = 2;
const PRICE_PCT = 0.25;

function idOf(c) {
  return String(c._id || c.id || '');
}

function norm(v) {
  return String(v || '').trim().toLowerCase();
}

function priceOk(pa, pb) {
  const lo = Math.min(pa, pb);
  const hi = Math.max(pa, pb);
  if (!(lo > 0) || hi / lo > MAX_PRICE_RATIO) return false;
  const pct = Math.abs(pa - pb) / ((pa + pb) / 2);
  return pct <= PRICE_PCT || sameBudgetBucket(pa, pb);
}

function pairScore(a, b, { requireSameBody } = { requireSameBody: true }) {
  if (idOf(a) === idOf(b)) return -1;
  const pa = num(a.price);
  const pb = num(b.price);
  if (!priceOk(pa, pb)) return -1;

  const ba = norm(a.bodyType);
  const bb = norm(b.bodyType);
  if (requireSameBody && ba && bb && ba !== bb) return -1;

  const mid = (pa + pb) / 2;
  const pct = Math.abs(pa - pb) / mid;
  let s = 30;
  if (sameBudgetBucket(pa, pb)) s += 20;
  s += Math.round((1 - Math.min(pct, PRICE_PCT) / PRICE_PCT) * 20);

  if (ba && bb && ba === bb) s += 50;
  else if (!ba || !bb) s += 8;

  const ya = num(a.year);
  const yb = num(b.year);
  if (ya && yb) {
    const yd = Math.abs(ya - yb);
    if (yd <= 3) s += 15;
    else if (yd <= 5) s += 8;
  }

  const ka = num(a.kmDriven);
  const kb = num(b.kmDriven);
  if (ka > 0 && kb > 0) {
    const kdiff = Math.abs(ka - kb) / Math.max(ka, kb);
    if (kdiff <= 0.3) s += 10;
    else if (kdiff <= 0.5) s += 4;
  }

  if (a.fuel && b.fuel && norm(a.fuel) === norm(b.fuel)) s += 8;

  const ma = String(a.model?._id || a.model?.name || a.model || '');
  const mb = String(b.model?._id || b.model?.name || b.model || '');
  if (ma && mb && ma !== mb) s += 6;

  return s;
}

function pickPairs(cars, { requireSameBody, used, maxPairs }) {
  const list = cars.filter((c) => num(c.price) > 0 && idOf(c) && !used.has(idOf(c)));
  const edges = [];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const score = pairScore(list[i], list[j], { requireSameBody });
      if (score > 0) edges.push({ a: list[i], b: list[j], score });
    }
  }
  edges.sort((x, y) => y.score - x.score);

  const pairs = [];
  for (const edge of edges) {
    const ia = idOf(edge.a);
    const ib = idOf(edge.b);
    if (used.has(ia) || used.has(ib)) continue;
    used.add(ia);
    used.add(ib);
    pairs.push(edge);
    if (pairs.length >= maxPairs) break;
  }
  return pairs;
}

/**
 * Fair used-car VS pairs: similar budget, prefer same body / year / km.
 * Never force a pairing when no fair partner exists.
 */
function buildSuggestedPairs(cars, maxPairs = 8) {
  const pool = (cars || []).filter((c) => num(c.price) > 0 && (c.images || []).length);
  const used = new Set();
  const strict = pickPairs(pool, { requireSameBody: true, used, maxPairs });
  if (strict.length >= Math.min(4, maxPairs)) return strict.slice(0, maxPairs);
  const loose = pickPairs(pool, {
    requireSameBody: false,
    used,
    maxPairs: maxPairs - strict.length,
  });
  return [...strict, ...loose].slice(0, maxPairs);
}

module.exports = { buildSuggestedPairs, pairScore, priceOk };
