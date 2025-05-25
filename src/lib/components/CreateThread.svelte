<script lang="ts">
	import { token, createThreadModal, threads, user } from '../../lib/stores';
	let title = '';
	let initialComment = '';

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
			
			// If there's an initial comment, add it to the thread
			if (initialComment.trim()) {
				await addInitialComment(newThread.id);
			}
			
            closeModal();
        } else {
            // Handle error
        }
    };

	const addInitialComment = async (threadId: number) => {
		try {
			const response = await fetch(`/comments/${threadId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`
				},
				body: JSON.stringify({ content: initialComment })
			});

			if (!response.ok) {
				console.error('Failed to add initial comment');
			}
		} catch (error) {
			console.error('Error adding initial comment:', error);
		}
	};

    const closeModal = () => {
        $createThreadModal = false;
		title = '';
		initialComment = '';
    };


</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Create Thread</h2>
		<form on:submit|preventDefault={createThread}>
			<label for="title">Title</label>
			<input type="text" id="title" bind:value={title} required />
			
			<label for="initialComment">Initial Comment (optional)</label>
			<textarea 
				id="initialComment" 
				bind:value={initialComment} 
				placeholder="Add an initial comment to start the discussion..."
			></textarea>
			
			<button type="submit">Create Thread</button>
			<button type="button" on:click={closeModal}>Cancel</button>
		</form>
	</div>
</div>

<style>
    input, textarea {
        max-width: calc(100vw - 40px);
    }
	
	textarea {
		height: 120px;
		resize: vertical;
		min-height: 80px;
	}
	
    button {
        margin-top: 5px;
    }
	
	label {
		margin-top: 10px;
	}
	
	label:first-child {
		margin-top: 0;
	}
</style>
