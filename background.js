import { matchService, summarize } from './rating.mjs';
const pending = new Map();
const ttl = 24 * 60 * 60 * 1000;

async function lookup(host) {
  const key = `terms:${host}`;
  const saved = (await chrome.storage.local.get(key))[key];
  if (saved && Date.now() - saved.time < ttl) return saved.result;
  // Try the hostname, then its parents; domain matching still guards every result.
  let query = host;
  let service = null;
  while (query.includes('.')) {
    const response = await fetch(`https://api.tosdr.org/search/v5?query=${encodeURIComponent(query)}`, {
      credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Lookup failed');
    const data = await response.json();
    if (!Array.isArray(data.services)) throw new Error('Invalid response');
    service = matchService(host, data.services);
    if (service) break;
    query = query.slice(query.indexOf('.') + 1);
  }
  const result = summarize(service);
  // Bound persistent storage and remove expired entries.
  const all = await chrome.storage.local.get(null);
  const entries = Object.entries(all).filter(([name]) => name.startsWith('terms:')).sort((a, b) => a[1].time - b[1].time);
  const expired = entries.filter(([, value], index) => Date.now() - value.time >= ttl || index < entries.length - 499).map(([name]) => name);
  if (expired.length) await chrome.storage.local.remove(expired);
  await chrome.storage.local.set({ [key]: { time: Date.now(), result } });
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type !== 'terms-rating' || sender.frameId !== 0 || !sender.tab) return;
  let url;
  try { url = new URL(sender.url); } catch { return; }
  if (!['http:', 'https:'].includes(url.protocol)) return;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (!host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') || /^[\d.]+$/.test(host) || host.includes(':')) {
    reply({ state: 'unknown' }); return;
  }
  if (!pending.has(host)) pending.set(host, lookup(host).finally(() => pending.delete(host)));
  pending.get(host).then(reply, () => reply({ state: 'error' }));
  return true;
});
