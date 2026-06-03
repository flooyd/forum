<script lang="ts">
	// A pill for a tag. `tag` is { name, color, count }.
	export let tag: any;
	export let active: boolean = false;
	export let count: boolean = false;
	export let interactive: boolean = false;
	export let onClick: (() => void) | null = null;
</script>

{#if tag}
	<button
		type="button"
		class="tag"
		class:tag--active={active}
		class:tag--btn={interactive || !!onClick}
		style="--tc:{tag.color || '#5b6cf0'}"
		on:click={(e) => { if (onClick) { e.preventDefault(); e.stopPropagation(); onClick(); } }}
	>
		<span class="tag__dot"></span>
		{tag.name}
		{#if count && tag.count != null}<span class="tag__count">{tag.count}</span>{/if}
	</button>
{/if}
