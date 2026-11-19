// Stale-while-revalidate cache for slow, rarely-changing public data.
// Visitors always get the saved copy at once; when it is older than `ttlMs`
// it is rebuilt in the background (one rebuild at a time). Only the very
// first call after a restart waits — and warm() runs that at startup.
export function swrCache(build, ttlMs) {
  let value = null;
  let at = 0;
  let inflight = null;

  const refresh = () => {
    if (!inflight) {
      inflight = Promise.resolve()
        .then(build)
        .then((v) => { value = v; at = Date.now(); return v; })
        .finally(() => { inflight = null; });
    }
    return inflight;
  };

  return {
    async get() {
      if (value === null) return refresh();
      if (Date.now() - at > ttlMs) refresh().catch((e) => console.error("swrCache refresh failed:", e.message));
      return value;
    },
    // Fire-and-forget fill, e.g. at server start.
    warm() { refresh().catch((e) => console.error("swrCache warm failed:", e.message)); },
    // Next get() rebuilds in the background but still serves the old copy.
    invalidate() { at = 0; },
  };
}
