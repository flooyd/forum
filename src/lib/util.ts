// Small formatting helpers shared across the redesigned Forum components.

export function rel(ts: number | string): string {
	const t = typeof ts === 'string' ? Date.parse(ts) : ts;
	const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
	if (s < 60) return 'just now';
	const mi = Math.floor(s / 60); if (mi < 60) return `${mi}m ago`;
	const hr = Math.floor(mi / 60); if (hr < 24) return `${hr}h ago`;
	const dy = Math.floor(hr / 24); if (dy < 30) return `${dy}d ago`;
	const mo = Math.floor(dy / 30); if (mo < 12) return `${mo}mo ago`;
	return `${Math.floor(mo / 12)}y ago`;
}

export function fullDate(ts: number | string): string {
	return new Date(ts).toLocaleString(undefined, {
		month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
	});
}

export function compact(n: number): string {
	if (n == null) return '0';
	if (n < 1000) return '' + n;
	return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace('.0', '') + 'k';
}

export function initials(name: string): string {
	const p = (name || '?').trim().split(/\s+/);
	return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

// Deterministic accent color for an avatar when the user has no stored color.
const AVATAR_COLORS = ['#5b6cf0', '#0ea5a3', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#65a30d'];
export function avatarColor(seed: string | number | undefined | null): string {
	const s = String(seed ?? '');
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
