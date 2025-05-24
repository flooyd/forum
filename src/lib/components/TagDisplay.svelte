<script lang="ts">
	export let tags: any[] = [];
	export let maxDisplay = 3;
	
	$: displayedTags = tags.slice(0, maxDisplay);
	$: hiddenCount = Math.max(0, tags.length - maxDisplay);
</script>

<div class="tags-display">	{#each displayedTags as tag}
		<span class="tag" style="background-color: {tag.color || 'lightblue'}">
			{tag.name}
		</span>
	{/each}
	{#if hiddenCount > 0}
		<span class="more-tags">+{hiddenCount} more</span>
	{/if}
</div>

<style>
	.tags-display {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin: 3px 0;
	}

	.tag {
		display: inline-block;
		padding: 1px 4px;
		border-radius: 8px;
		color: black;
		font-weight: bold;
		white-space: nowrap;
	}

	.more-tags {
		color: #020101;
		font-size: 0.65em;
		font-style: italic;
	}
</style>
