const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export async function fetchWithProxy(url: string): Promise<string> {
  for (const buildUrl of PROXIES) {
    try {
      const proxyUrl = buildUrl(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // try next proxy
    }
  }
  throw new Error(`Failed to fetch ${url} through all proxies`);
}
