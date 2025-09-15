// Simple localStorage-based frequency capping per slotId.
interface FrequencyRecord { last: number; impressions: number; }

const KEY = 'ad_freq_v1';
interface StoredMap { [slotId: string]: FrequencyRecord; }

function load(): StoredMap {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function save(map: StoredMap) { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {} }

export function shouldRecordImpression(slotId: string, minIntervalMs = 30_000): boolean {
  const map = load();
  const rec = map[slotId];
  if (!rec) return true;
  return Date.now() - rec.last >= minIntervalMs;
}

export function recordImpression(slotId: string) {
  const map = load();
  const rec = map[slotId];
  if (rec) {
    rec.last = Date.now();
    rec.impressions += 1;
  } else {
    map[slotId] = { last: Date.now(), impressions: 1 };
  }
  save(map);
}

export function getImpressionInfo(slotId: string): FrequencyRecord | null {
  const map = load();
  return map[slotId] || null;
}