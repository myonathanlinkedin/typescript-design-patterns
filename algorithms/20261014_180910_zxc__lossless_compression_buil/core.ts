export type Match = { offset: number; length: number } | null;

/**
 * Find the longest match for data at position `pos` within the previous `maxOffset` bytes.
 * Returns a Match object if a match of at least `minMatch` length is found, otherwise null.
 */
function findMatch(
  data: Uint8Array,
  pos: number,
  maxOffset = 255,
  maxLength = 130,
  minMatch = 3
): Match {
  const end = Math.min(data.length, pos + maxLength);
  let best: Match = null;

  const searchStart = Math.max(0, pos - maxOffset);
  for (let offsetPos = searchStart; offsetPos < pos; offsetPos++) {
    const offset = pos - offsetPos;
    let length = 0;
    while (
      length < maxLength &&
      pos + length < data.length &&
      data[offsetPos + length] === data[pos + length]
    ) {
      length++;
    }
    if (length >= minMatch && (!best || length > best.length)) {
      best = { offset, length };
      if (length === maxLength) break; // cannot get longer
    }
  }
  return best;
}

/**
 * Compresses a Uint8Array using a simple LZ77‑like scheme.
 * Token format (1 byte control + optional payload):
 *   - 0xxxxxxx : literal run of (control + 1) bytes.
 *   - 1xxxxxxx : back‑reference; length = (control & 0x7F) + 3, followed by 1‑byte offset.
 */
export function compress(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  let pos = 0;
  const literals: number[] = [];

  while (pos < input.length) {
    const match = findMatch(input, pos);
    if (match) {
      // Flush pending literals
      if (literals.length > 0) {
        // Emit in chunks of max 128 literals
        let i = 0;
        while (i < literals.length) {
          const chunk = Math.min(128, literals.length - i);
          out.push(chunk - 1); // high bit 0
          out.push(...literals.slice(i, i + chunk));
          i += chunk;
        }
        literals.length = 0;
      }
      // Emit back‑reference
      const lengthField = match.length - 3; // 0..127
      out.push(0x80 | lengthField);
      out.push(match.offset);
      pos += match.length;
    } else {
      // No sufficient match, collect literal
      literals.push(input[pos]);
      // If literals reach 128, flush immediately (max literal length)
      if (literals.length === 128) {
        out.push(127); // 128 literals => control = 127 (0x7F)
        out.push(...literals);
        literals.length = 0;
      }
      pos++;
    }
  }

  // Flush any remaining literals
  if (literals.length > 0) {
    let i = 0;
    while (i < literals.length) {
      const chunk = Math.min(128, literals.length - i);
      out.push(chunk - 1);
      out.push(...literals.slice(i, i + chunk));
      i += chunk;
    }
  }

  return Uint8Array.from(out);
}

/**
 * Decompresses data produced by `compress`.
 */
export function decompress(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ctrl = input[pos++];
    if ((ctrl & 0x80) === 0) {
      // Literal run
      const length = (ctrl & 0x7f) + 1;
      for (let i = 0; i < length; i++) {
        out.push(input[pos++]);
      }
    } else {
      // Back‑reference
      const length = (ctrl & 0x7f) + 3;
      const offset = input[pos++];
      const start = out.length - offset;
      for (let i = 0; i < length; i++) {
        out.push(out[start + i]);
      }
    }
  }

  return Uint8Array.from(out);
}
