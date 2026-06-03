<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from './Icon.svelte';

	export let isOpen = false;
	export let imageSrc = '';
	export let imageAlt = '';
	export let images: any[] = [];
	export let currentIndex = 0;

	const dispatch = createEventDispatcher();

	const close = () => dispatch('close');

	const show = (i: number) => {
		if (!images.length) return;
		currentIndex = (i + images.length) % images.length;
		imageSrc = images[currentIndex].url || images[currentIndex].src;
		imageAlt = images[currentIndex].alt || '';
	};
	const next = () => show(currentIndex + 1);
	const prev = () => show(currentIndex - 1);

	const onKey = (e: KeyboardEvent) => {
		if (!isOpen) return;
		if (e.key === 'Escape') close();
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();
	};
</script>

<svelte:window on:keydown={onKey} />

{#if isOpen}
	<div class="lightbox" on:mousedown={(e) => e.target === e.currentTarget && close()}>
		<button class="lightbox__close" on:click={close} type="button" aria-label="Close">
			<Icon name="x" size={22} stroke={2.1} />
		</button>

		{#if images.length > 1}
			<button class="lightbox__nav lightbox__nav--prev" on:click={prev} type="button" aria-label="Previous">
				<Icon name="back" size={24} stroke={2.1} />
			</button>
			<button class="lightbox__nav lightbox__nav--next" on:click={next} type="button" aria-label="Next">
				<Icon name="arrow" size={24} stroke={2.1} />
			</button>
		{/if}

		<figure class="lightbox__fig">
			<img src={imageSrc} alt={imageAlt} />
			{#if imageAlt}<figcaption>{imageAlt}</figcaption>{/if}
			{#if images.length > 1}
				<span class="lightbox__count">{currentIndex + 1} / {images.length}</span>
			{/if}
		</figure>
	</div>
{/if}

<style>
	.lightbox {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 48px;
		background: oklch(0.15 0.02 265 / 0.84);
		backdrop-filter: blur(8px);
		animation: lbIn 0.2s ease both;
	}
	@keyframes lbIn { from { opacity: 0; } to { opacity: 1; } }
	.lightbox__fig {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		max-width: 100%;
		max-height: 100%;
		animation: lbZoom 0.26s cubic-bezier(0.16, 0.9, 0.3, 1) both;
	}
	@keyframes lbZoom { from { transform: scale(0.94); opacity: 0; } to { transform: none; opacity: 1; } }
	.lightbox__fig img {
		max-width: 100%;
		max-height: 78vh;
		border-radius: var(--r-md);
		box-shadow: var(--shadow-lg);
	}
	.lightbox__fig figcaption {
		color: oklch(0.9 0.01 265);
		font-size: 0.88rem;
	}
	.lightbox__count {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: oklch(0.8 0.01 265);
	}
	.lightbox__close,
	.lightbox__nav {
		position: fixed;
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		color: #fff;
		background: oklch(0.3 0.02 265 / 0.6);
		transition: background 0.16s, transform 0.16s;
	}
	.lightbox__close:hover,
	.lightbox__nav:hover { background: oklch(0.4 0.02 265 / 0.8); }
	.lightbox__close { top: 24px; right: 24px; }
	.lightbox__nav--prev { left: 24px; top: 50%; transform: translateY(-50%); }
	.lightbox__nav--next { right: 24px; top: 50%; transform: translateY(-50%); }
	.lightbox__nav--prev:hover { transform: translateY(-50%) scale(1.08); }
	.lightbox__nav--next:hover { transform: translateY(-50%) scale(1.08); }
</style>
