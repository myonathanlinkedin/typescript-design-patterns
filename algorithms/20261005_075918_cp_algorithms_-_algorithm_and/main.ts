type CombineFn<T> = (a: T, b: T) => T;

class SegmentTree<T> {
  private size: number;
  private tree: T[];
  private combine: CombineFn<T>;
  private neutral: T;

  constructor(data: T[], combine: CombineFn<T>, neutral: T) {
    if (data.length === 0) throw new Error('Input array must not be empty');
    this.combine = combine;
    this.neutral = neutral;
    this.size = 1;
    while (this.size < data.length) this.size <<= 1;
    this.tree = new Array(this.size * 2).fill(this.neutral);
    for (let i = 0; i < data.length; i++) this.tree[this.size + i] = data[i];
    for (let i = this.size - 1; i > 0; i--) this.tree[i] = this.combine(this.tree[i << 1], this.tree[(i << 1) | 1]);
  }

  /** Update element at position idx (0‑based) to value */
  update(idx: number, value: T): void {
    if (idx < 0 || idx >= this.size) throw new RangeError('Index out of bounds');
    let pos = this.size + idx;
    this.tree[pos] = value;
    while (pos > 1) {
      pos >>= 1;
      this.tree[pos] = this.combine(this.tree[pos << 1], this.tree[(pos << 1) | 1]);
    }
  }

  /** Query on interval [l, r] inclusive (0‑based) */
  query(l: number, r: number): T {
    if (l < 0 || r < 0 || l >= this.size || r >= this.size || l > r) throw new RangeError('Invalid query range');
    l += this.size;
    r += this.size;
    let resLeft = this.neutral;
    let resRight = this.neutral;
    while (l <= r) {
      if ((l & 1) === 1) resLeft = this.combine(resLeft, this.tree[l++]);
      if ((r & 1) === 0) resRight = this.combine(this.tree[r--], resRight);
      l >>= 1;
      r >>= 1;
    }
    return this.combine(resLeft, resRight);
  }
}

/* ---------- Unit Tests ---------- */
(() => {
  // Sum segment tree
  const sumCombine = (a: number, b: number) => a + b;
  const sumNeutral = 0;
  const data = [1, 2, 3, 4, 5];
  const segSum = new SegmentTree<number>(data, sumCombine, sumNeutral);

  console.assert(segSum.query(0, 4) === 15, 'Total sum should be 15');
  console.assert(segSum.query(1, 3) === 9, 'Sum 1..3 should be 9');
  segSum.update(2, 10); // array becomes [1,2,10,4,5]
  console.assert(segSum.query(1, 3) === 16, 'After update sum 1..3 should be 16');
  console.assert(segSum.query(2, 2) === 10, 'Single element query should be 10');

  // Min segment tree
  const minCombine = (a: number, b: number) => Math.min(a, b);
  const minNeutral = Number.POSITIVE_INFINITY;
  const segMin = new SegmentTree<number>(data, minCombine, minNeutral);
  console.assert(segMin.query(0, 4) === 1, 'Min of whole array should be 1');
  console.assert(segMin.query(2, 4) === 3, 'Min of 2..4 should be 3');
  segMin.update(0, 6);
  console.assert(segMin.query(0, 2) === 2, 'After update min 0..2 should be 2');

  // Edge cases
  const single = new SegmentTree<number>([42], sumCombine, sumNeutral);
  console.assert(single.query(0, 0) === 42, 'Single element query');
  single.update(0, 7);
  console.assert(single.query(0, 0) === 7, 'Single element after update');

  console.log('All tests passed.');
})();
