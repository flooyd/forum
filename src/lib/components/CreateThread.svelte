<script lang="ts">
	import { token, createThreadModal, threads, user } from '../../lib/stores';
	let title = '';

    const createThread = async () => {
        const response = await fetch('/threads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${$token}`
            },
            body: JSON.stringify({ title })
        });

        if (response.ok) {
            // Handle successful thread creation
            const data = await response.json();
			const newThread = data.thread[0];
			newThread.avatar = $user.avatar;
			newThread.displayName = $user.displayName;
            $threads = [...$threads, newThread];
			console.log($threads);
            closeModal();
        } else {
            // Handle error
        }
    };

    const closeModal = () => {
        $createThreadModal = false;
    };


</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Create Thread</h2>
		<form on:submit|preventDefault={createThread}>
			<label for="title">Title</label>
			<input type="text" id="title" bind:value={title} required />
			<button type="submit">Create</button>
			<button on:click={closeModal}>Cancel</button>
		</form>
	</div>
</div>

<style>
    input {
        max-width: calc(100vw - 40px);
    }
</style>
