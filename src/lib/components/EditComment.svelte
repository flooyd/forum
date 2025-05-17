<script lang="ts">
	import { token, editCommentModal } from '../../lib/stores';
	let title = '';
    export let comment: any = {};

    const editComment = async () => {
        const response = await fetch(`/comments/${comment.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${$token}`
            },
            body: JSON.stringify({ content: comment.content, commentId: comment.id })
        });

        if (response.ok) {
            $editCommentModal = false;
        } else {
            // Handle error
        }
    };

    const closeModal = () => {
        $editCommentModal = null;
    };


</script>

<div class="modalBackground">
	<div class="modal">
		<h2>Edit Comment</h2>
		<form on:submit|preventDefault={editComment}>
			<label for="title">Content</label>
			<input type="text" id="title" bind:value={comment.content} required />
			<button type="submit">Edit</button>
			<button on:click={closeModal}>Cancel</button>
		</form>
	</div>
</div>

<style>
    input {
        max-width: calc(100vw - 40px);
    }
</style>
