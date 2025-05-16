<script lang="ts">
	import { token, createThreadModal, threads } from '../../lib/stores';
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
            const newThread = await response.json();
            $threads = [...$threads, newThread];
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
	.modalBackground {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.modal {
		background-color: black;
		padding: 20px;
		border-radius: 5px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
        width: calc(100vw - 40px);
        height: calc(100vh - 40px);
	}

    input {
        max-width: calc(100vw - 40px);
    }
</style>
