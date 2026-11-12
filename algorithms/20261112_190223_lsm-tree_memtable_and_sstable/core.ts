type Key = string;
type Value = string;

interface Entry {
  key: Key;
  value: Value;
  seq: number; // monotonically increasing sequence number for versioning
}

/**
 * Simple binary search on a sorted array of entries.
 * Returns index of found entry or bitwise complement of insertion point.
 */
function binarySearch(arr: Entry[], key: Key): number {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const cmp = arr[mid].key.localeCompare(key);
    if (cmp === 0) return mid;
    if (cmp < 0) lo = mid + 1;
    else hi = mid - 1;
  }
  return ~lo;
}

/** In‑memory mutable sorted table (MemTable). */
export class MemTable {
  private map = new Map<Key, Entry>();
  private count = 0;

  /** Insert or overwrite a key. */
  put(entry: Entry): void {
    if (!this.map.has(entry.key)) this.count++;
    this.map.set(entry.key, entry);
  }

  /** Retrieve the latest entry for a key, if present. */
  get(key: Key): Entry | undefined {
    return this.map.get(key);
  }

  /** Number of distinct keys stored. */
  size(): number {
    return this.count;
  }

  /** Return all entries sorted by key. */
  sortedEntries(): Entry[] {
    const arr = Array.from(this.map.values());
    arr.sort((a, b) => a.key.localeCompare(b.key));
    return arr;
  }

  /** Reset the MemTable to empty state. */
  clear(): void {
    this.map.clear();
    this.count = 0;
  }
}

/** Immutable on‑disk representation (simulated in memory). */
export class SSTable {
  private readonly data: Entry[];

  constructor(entries: Entry[]) {
    // entries must already be sorted by key
    this.data = entries;
  }

  /** Binary‑search lookup. */
  get(key: Key): Entry | undefined {
    const idx = binarySearch(this.data, key);
    return idx >= 0 ? this.data[idx] : undefined;
  }

  /** Iterate over all entries in key order. */
  *entries(): IterableIterator<Entry> {
    for (const e of this.data) yield e;
  }

  /** Number of entries stored. */
  size(): number {
    return this.data.length;
  }
}

/** LSM‑Tree engine handling MemTable, flushes, and compaction. */
export class LSMTree {
  private mem: MemTable;
  private sstables: SSTable[] = [];
  private seq = 0;

  /** Configuration parameters. */
  constructor(
    private readonly memThreshold: number = 4,
    private readonly compactionThreshold: number = 3
  ) {
    this.mem = new MemTable();
  }

  /** Insert a key/value pair. */
  put(key: Key, value: Value): void {
    const entry: Entry = { key, value, seq: ++this.seq };
    this.mem.put(entry);
    if (this.mem.size() >= this.memThreshold) this.flush();
  }

  /** Retrieve the most recent value for a key, or undefined. */
  get(key: Key): Value | undefined {
    // Check MemTable first (most recent writes)
    const memEntry = this.mem.get(key);
    if (memEntry) return memEntry.value;

    // Search SSTables from newest to oldest
    for (let i = this.sstables.length - 1; i >= 0; i--) {
      const e = this.sstables[i].get(key);
      if (e) return e.value;
    }
    return undefined;
  }

  /** Force a MemTable flush (useful for tests). */
  flush(): void {
    if (this.mem.size() === 0) return;
    const sorted = this.mem.sortedEntries();
    const sstable = new SSTable(sorted);
    this.sstables.push(sstable);
    this.mem.clear();
    this.maybeCompact();
  }

  /** Return current number of SSTables (for testing). */
  sstableCount(): number {
    return this.sstables.length;
  }

  /** Internal: trigger compaction when too many SSTables exist. */
  private maybeCompact(): void {
    if (this.sstables.length <= this.compactionThreshold) return;
    // Simple level‑0 compaction: merge all existing tables into one.
    const merged = this.mergeAll(this.sstables);
    this.sstables = [merged];
  }

  /** Merge multiple sorted SSTables into a single sorted SSTable. */
  private mergeAll(tables: SSTable[]): SSTable {
    const iterators = tables.map(t => t.entries());
    const heads: (Entry | null)[] = iterators.map(it => it.next().value ?? null);
    const result: Entry[] = [];

    while (heads.some(h => h !== null)) {
      // Find smallest key among heads
      let minIdx = -1;
      for (let i = 0; i < heads.length; i++) {
        const h = heads[i];
        if (h === null) continue;
        if (minIdx === -1 || h.key.localeCompare(heads[minIdx]!.key) < 0) {
          minIdx = i;
        }
      }
      const minEntry = heads[minIdx]!;
      // Resolve duplicates: keep entry with highest seq (newest)
      let duplicateIdxs: number[] = [minIdx];
      for (let i = 0; i < heads.length; i++) {
        if (i !== minIdx && heads[i]?.key === minEntry.key) duplicateIdxs.push(i);
      }
      let chosen = minEntry;
      for (const idx of duplicateIdxs) {
        const cand = heads[idx]!;
        if (cand.seq > chosen.seq) chosen = cand;
        // Advance iterator for each duplicate
        const nxt = iterators[idx].next();
        heads[idx] = nxt.done ? null : nxt.value;
      }
      result.push(chosen);
    }
    return new SSTable(result);
  }
}
