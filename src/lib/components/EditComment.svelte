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
			<textarea id="title" bind:value={comment.content} required></textarea>
			<button type="submit">Edit</button>
			<button on:click={closeModal}>Cancel</button>
		</form>
	</div>
</div>

<style>
   textarea {
        width: 100%;
        height: calc(100vh - 200px);
   }
</style>
