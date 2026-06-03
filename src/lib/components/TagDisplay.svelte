<script lang="ts">
	import Tag from './Tag.svelte';
	export let tags: any[] = [];
	export let maxDisplay = 3;

	$: displayed = tags.slice(0, maxDisplay);
	$: hidden = Math.max(0, tags.length - maxDisplay);
</script>

<div class="tags-display">
	{#each displayed as tag}<Tag {tag} />{/each}
	{#if hidden > 0}<span class="more-tags">+{hidden} more</span>{/if}
</div>

<style>
	.tags-display {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}
	.more-tags {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--text-3);
	}
</style>
