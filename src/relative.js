export function flag(countryCode) {
  if (!/^[a-z]{2}$/i.test(countryCode ?? '')) return '—';
  return [...countryCode.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

export function gapLabel(gap, isPlayer) {
  if (isPlayer) return '0.000';
  if (!Number.isFinite(gap)) return '—';
  return `${gap > 0 ? '+' : gap < 0 ? '−' : ''}${Math.abs(gap).toFixed(3)}`;
}

// gapSeconds: negative = ahead on track; positive = behind on track.
// The telemetry bridge must supply track-relative gaps, not race-leader gaps.
export function relativeRows(drivers, playerId, count = 3) {
  const player = drivers.find(d => d.id === playerId);
  if (!player) return [];
  const others = drivers.filter(d => d.id !== playerId && Number.isFinite(d.gapSeconds));
  const ahead = others.filter(d => d.gapSeconds < 0).sort((a,b) => b.gapSeconds-a.gapSeconds).slice(0,count).reverse();
  const behind = others.filter(d => d.gapSeconds >= 0).sort((a,b) => a.gapSeconds-b.gapSeconds).slice(0,count);
  return [...ahead, {...player, gapSeconds: 0}, ...behind];
}
