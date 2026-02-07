// backend/game/services/flow/stateDiff.ts
/**
 * Very small, safe state diff utility.
 *
 * Design goals:
 * - Minimal work
 * - No external deps
 * - Deterministic output
 * - Replace arrays wholesale
 * - Good enough to reduce payloads now
 *
 * This is NOT JSON Patch.
 * This is a simple { path, value } list.
 */

export type DiffPatch = {
  path: string;
  value: any;
};

/**
 * Compute a diff between two plain objects.
 * Assumes:
 * - No functions
 * - No circular refs
 * - State is JSON-serializable
 */
export function diffState(
  prev: any,
  next: any,
  basePath = ""
): DiffPatch[] {
  const patches: DiffPatch[] = [];

  // Type change → replace whole subtree
  if (typeof prev !== typeof next) {
    patches.push({ path: basePath || "/", value: next });
    return patches;
  }

  // Primitive values
  if (
    prev === null ||
    next === null ||
    typeof prev !== "object" ||
    typeof next !== "object"
  ) {
    if (prev !== next) {
      patches.push({ path: basePath || "/", value: next });
    }
    return patches;
  }

  // Arrays → replace whole array if changed
  if (Array.isArray(prev) || Array.isArray(next)) {
    const prevStr = JSON.stringify(prev);
    const nextStr = JSON.stringify(next);
    if (prevStr !== nextStr) {
      patches.push({ path: basePath || "/", value: next });
    }
    return patches;
  }

  // Objects → recurse by keys
  const keys = new Set([
    ...Object.keys(prev),
    ...Object.keys(next),
  ]);

  for (const key of keys) {
    const pVal = (prev as any)[key];
    const nVal = (next as any)[key];

    const path = basePath ? `${basePath}/${key}` : `/${key}`;

    // Key removed
    if (!(key in next)) {
      patches.push({ path, value: undefined });
      continue;
    }

    // Key added
    if (!(key in prev)) {
      patches.push({ path, value: nVal });
      continue;
    }

    // Recurse
    patches.push(...diffState(pVal, nVal, path));
  }

  return patches;
}
