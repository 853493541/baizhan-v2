// backend/game/services/flow/stateDiff.ts

/**
 * Small, safe state diff utility.
 *
 * Improvements:
 * - Never emit "/" root replacement
 * - Special handling for large arrays (deck / discard / events)
 * - Arrays default to replace ONLY when unavoidable
 *
 * Still NOT JSON Patch.
 */

export type DiffPatch = {
  path: string;
  value: any;
};

// Arrays we NEVER wholesale replace
const LARGE_ARRAY_KEYS = new Set(["deck", "discard", "events"]);

export function diffState(
  prev: any,
  next: any,
  basePath = ""
): DiffPatch[] {
  const patches: DiffPatch[] = [];

  const safePath = basePath || "/state";

  // Type change → replace subtree (but never "/")
  if (typeof prev !== typeof next) {
    patches.push({ path: safePath, value: next });
    return patches;
  }

  // Primitive
  if (
    prev === null ||
    next === null ||
    typeof prev !== "object" ||
    typeof next !== "object"
  ) {
    if (prev !== next) {
      patches.push({ path: safePath, value: next });
    }
    return patches;
  }

  // Arrays
  if (Array.isArray(prev) || Array.isArray(next)) {
    const parts = basePath.split("/");
const key = parts.length ? parts[parts.length - 1] : undefined;

    // Special handling for big arrays
    if (key && LARGE_ARRAY_KEYS.has(key)) {
      // append
      if (next.length > prev.length) {
        for (let i = prev.length; i < next.length; i++) {
          patches.push({
            path: `${safePath}/${i}`,
            value: next[i],
          });
        }
        return patches;
      }

      // clear
      if (next.length === 0 && prev.length > 0) {
        patches.push({ path: safePath, value: [] });
        return patches;
      }

      // otherwise: do nothing (no full replace)
      return patches;
    }

    // Small arrays → replace safely
    const prevStr = JSON.stringify(prev);
    const nextStr = JSON.stringify(next);
    if (prevStr !== nextStr) {
      patches.push({ path: safePath, value: next });
    }
    return patches;
  }

  // Objects → recurse
  const keys = new Set([
    ...Object.keys(prev),
    ...Object.keys(next),
  ]);

  for (const key of keys) {
    const pVal = prev[key];
    const nVal = next[key];
    const path = basePath ? `${basePath}/${key}` : `/${key}`;

    // removed
    if (!(key in next)) {
      patches.push({ path, value: undefined });
      continue;
    }

    // added
    if (!(key in prev)) {
      patches.push({ path, value: nVal });
      continue;
    }

    patches.push(...diffState(pVal, nVal, path));
  }

  return patches;
}
