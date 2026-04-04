const PROXY_BUILDERS = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://proxy.cors.sh/${url}`,
];

export async function fetchWithProxy(url: string): Promise<string> {
  // Race all proxies simultaneously — fastest one wins
  return Promise.any(
    PROXY_BUILDERS.map(build =>
      fetch(build(url), { signal: AbortSignal.timeout(12000) }).then(res => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.text();
      })
    )
  );
}
