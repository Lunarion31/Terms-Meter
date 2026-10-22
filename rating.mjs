export const scores = Object.freeze({ A: 10, B: 7.5, C: 5, D: 2.5, E: 0 });

// Only match declared domains, never a service's name or a substring.
// Path-specific listings cannot establish a whole-domain rating.
export function matchService(host, services) {
  const matches = [];
  for (const service of services) {
    for (const address of service.urls || []) {
      try {
        const url = new URL(/^https?:\/\//i.test(address) ? address : `https://${address}`);
        const domain = url.hostname.toLowerCase().replace(/^www\./, '');
        if (url.pathname !== '/' || url.search || url.hash) continue;
        if (host === domain || host.endsWith(`.${domain}`)) matches.push({ service, length: domain.length });
      } catch { /* Ignore malformed directory entries. */ }
    }
  }
  matches.sort((a, b) => b.length - a.length || Number(a.service.id) - Number(b.service.id));
  return matches[0]?.service ?? null;
}

export function summarize(service) {
  if (!service) return { state: 'unknown' };
  const grade = service.rating;
  return {
    state: Object.hasOwn(scores, grade) ? 'rated' : 'unrated',
    grade, score: scores[grade] ?? null, name: service.name,
    url: Number.isSafeInteger(service.id) ? `https://tosdr.org/en/service/${service.id}` : 'https://tosdr.org/en',
    comprehensive: service.is_comprehensively_reviewed === true
  };
}
