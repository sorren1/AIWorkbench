function numericParts(version: string): readonly number[] | null {
  const match = /^(\d+(?:\.\d+)*)(?:-r(\d+))?/.exec(version);
  if (!match?.[1]) return null;
  return [
    ...match[1].split(".").map((part) => Number.parseInt(part, 10)),
    Number.parseInt(match[2] ?? "0", 10),
  ];
}

export function versionAtLeast(installed: string, minimum: string): boolean {
  const installedParts = numericParts(installed);
  const minimumParts = numericParts(minimum);
  if (!installedParts || !minimumParts) return false;
  const length = Math.max(installedParts.length, minimumParts.length);
  for (let index = 0; index < length; index += 1) {
    const left = installedParts[index] ?? 0;
    const right = minimumParts[index] ?? 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}
