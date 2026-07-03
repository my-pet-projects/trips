export function buildPiePaths(
  slices: { color: string; count: number }[],
  cx: number,
  cy: number,
  r: number,
): string {
  const total = slices.reduce((s, sl) => s + sl.count, 0);
  if (total === 0) return "";
  const nonEmpty = slices.filter((sl) => sl.count > 0);
  if (nonEmpty.length === 1) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${nonEmpty[0]!.color}"/>`;
  }
  let paths = "";
  let angle = -Math.PI / 2;
  for (const sl of nonEmpty) {
    const sweep = (sl.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${sweep > Math.PI ? 1 : 0},1 ${x2},${y2} Z" fill="${sl.color}"/>`;
  }
  return paths;
}
