<script lang="ts">
	import { initials, avatarColor } from '$lib/util';

	// `user` is any object that may carry { displayName, avatar, id, color }
	export let user: any = {};
	export let size: number = 36;
	export let ring: boolean = false;

	$: color = user?.color || avatarColor(user?.id ?? user?.username ?? user?.displayName);
</script>

<div
	class="avatar"
	style="
		width:{size}px; height:{size}px; border-radius:{size}px;
		background:{color}1f; color:{color}; font-size:{size * 0.4}px; font-weight:700;
		{ring ? `box-shadow:0 0 0 2px var(--bg),0 0 0 3.5px ${color}55;` : ''}
	"
>
	{#if user?.avatar}
		<img src={user.avatar} alt="" style="width:100%;height:100%;border-radius:{size}px;object-fit:cover" />
	{:else}
		<span>{initials(user?.displayName)}</span>
	{/if}
</div>
