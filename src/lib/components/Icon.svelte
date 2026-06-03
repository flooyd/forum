<script lang="ts">
	// Stroke-icon set used across the redesign. Pass a `name` from the list below.
	export let name: string;
	export let size: number = 18;
	export let stroke: number = 2;

	const ICONS: Record<string, string> = {
		search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35',
		plus: 'M12 5v14M5 12h14',
		chat: 'M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z',
		eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
		heart: 'M12 20s-7-4.6-9.2-9C1.3 7.8 3 5 6 5c1.9 0 3.2 1.1 4 2.3C10.8 6.1 12.1 5 14 5c3 0 4.7 2.8 3.2 6C19 15.4 12 20 12 20Z',
		pin: 'M12 17v5M9 3h6l-1 7 3 3H7l3-3-1-7Z',
		arrow: 'M5 12h14M13 6l6 6-6 6',
		back: 'M19 12H5M11 18l-6-6 6-6',
		quote: 'M7 7H4v6h3l-1 4h2l1-4V7H7Zm10 0h-3v6h3l-1 4h2l1-4V7h-2Z',
		edit: 'M4 20h4L18 10l-4-4L4 16v4ZM14 6l4 4',
		trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
		sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z',
		image: 'M3 5h18v14H3V5Zm3 11 4-5 3 4 2-2 4 3M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
		filter: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z',
		check: 'M5 12l5 5L20 6',
		x: 'M6 6l12 12M18 6 6 18',
		sort: 'M7 4v16M7 4 4 7m3-3 3 3M17 20V4m0 16 3-3m-3 3-3-3',
		shield: 'M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z',
		user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0',
		clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2',
		fire: 'M12 3c1 3-1.5 4-1.5 6.5A2.5 2.5 0 0 0 13 12c.5-1 .3-2 .3-2 1.5 1 2.7 2.6 2.7 4.5a4 4 0 1 1-8 0C8 11 12 9 12 3Z',
		bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 21h4',
		hash: 'M9 3 7 21M17 3l-2 18M4 9h16M3 15h16',
		logout: 'M16 17l5-5-5-5M21 12H9M12 3H5v18h7',
		sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4 12H2M22 12h-2M5 5 4 4M20 20l-1-1M19 5l1-1M4 20l1-1',
		moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'
	};
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
	stroke-width={stroke} stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0">
	<path d={ICONS[name]} />
</svg>
