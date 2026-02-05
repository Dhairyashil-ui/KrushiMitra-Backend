// Lightweight deduplicated debug logging utility.
// Prevents spamming identical lines within a short window.

const recentMessages = new Map<string, number>();

export function debugDedup(message: string, windowMs: number = 5000) {
  const now = Date.now();
  const last = recentMessages.get(message);
  if (last && now - last < windowMs) return; // suppress duplicate
  recentMessages.set(message, now);
  console.debug(message);
}

export function clearDebugDedup() {
  recentMessages.clear();
}

export function infoOnce(message: string) {
  if (!recentMessages.has(message)) {
    recentMessages.set(message, Date.now());
    console.info(message);
  }
}