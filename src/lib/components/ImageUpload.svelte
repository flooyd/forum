<script lang="ts">
	import { token } from '../../lib/stores';
	import Icon from './Icon.svelte';

	// Redesigned shell over the ORIGINAL upload/remove/insert logic. The network
	// calls match the real /images endpoint: POST returns { success, image },
	// DELETE soft-deletes server-side and returns { success }.

	export let threadId: number | null = null;
	export let commentId: number | null = null;
	export let multiple = false;
	export let maxSize = 10; // MB
	export let accept = 'image/*';
	export let buttonText = 'Upload image';
	export let disabled = false;

	export let onImageUploaded: ((image: any) => void) | undefined = undefined;
	export let onImageInserted:
		| ((data: { filename: string; altText: string; markdown: string; image: any }) => void)
		| undefined = undefined;
	export let onImageRemoved: ((data: { imageId: number }) => void) | undefined = undefined;

	let fileInput: HTMLInputElement;
	let uploading = false;
	let dragOver = false;
	let uploadedImages: any[] = [];

	const handleFileSelect = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const filesToUpload = Array.from(files);

		// Validate files
		for (const file of filesToUpload) {
			if (file.size > maxSize * 1024 * 1024) {
				alert(`File "${file.name}" is too large. Maximum size is ${maxSize}MB.`);
				return;
			}
			if (!file.type.startsWith('image/')) {
				alert(`File "${file.name}" is not an image.`);
				return;
			}
		}

		uploading = true;
		try {
			for (const file of filesToUpload) {
				await uploadImage(file);
				if (!multiple) break;
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert('Error uploading images. Please try again.');
		} finally {
			uploading = false;
		}
	};

	const uploadImage = async (file: File) => {
		const formData = new FormData();
		formData.append('image', file);
		formData.append('alt', file.name);
		if (threadId != null) formData.append('threadId', threadId.toString());
		if (commentId != null) formData.append('commentId', commentId.toString());

		const response = await fetch('/images', {
			method: 'POST',
			headers: { Authorization: `Bearer ${$token}` },
			body: formData
		});

		const result = await response.json();
		if (result.success) {
			uploadedImages = [...uploadedImages, result.image];
			onImageUploaded?.(result.image);
		} else {
			throw new Error(result.message);
		}
	};

	const insertImage = (image: any) => {
		const markdown = `![${image.alt}](${image.url})`;
		onImageInserted?.({ filename: image.filename, altText: image.alt, markdown, image });
	};

	const removeUploadedImage = async (imageId: number) => {
		try {
			const response = await fetch('/images', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${$token}` },
				body: JSON.stringify({ imageId })
			});
			const result = await response.json();
			if (result.success) {
				uploadedImages = uploadedImages.filter((img) => img.id !== imageId);
				onImageRemoved?.({ imageId });
			} else {
				alert('Error removing image: ' + result.message);
			}
		} catch (error) {
			console.error('Error removing image:', error);
			alert('Error removing image. Please try again.');
		}
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		dragOver = false;
		handleFileSelect(e.dataTransfer?.files ?? null);
	};
</script>

<div class="imgup">
	<label
		class="dropzone"
		class:is-over={dragOver}
		on:dragover|preventDefault={() => (dragOver = true)}
		on:dragleave={() => (dragOver = false)}
		on:drop={onDrop}
	>
		{#if uploading}
			<span class="spin"><Icon name="sparkle" size={20} stroke={2} /></span>
			<span>Uploading…</span>
		{:else}
			<Icon name="image" size={22} stroke={1.6} />
			<span>Drag {multiple ? 'images' : 'an image'} here or <u>{buttonText}</u></span>
			<span class="imgup__hint">Max {maxSize}MB · JPEG, PNG, GIF, WebP</span>
		{/if}
		<input
			bind:this={fileInput}
			type="file"
			{accept}
			{multiple}
			{disabled}
			hidden
			on:change={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
		/>
	</label>

	{#if uploadedImages.length}
		<div class="imgup__grid">
			{#each uploadedImages as image (image.id)}
				<div class="imgup__thumb">
					<img src={image.url} alt={image.alt || ''} />
					<div class="imgup__thumb-actions">
						<button type="button" class="imgup__chip" on:click={() => insertImage(image)} title="Insert into text">
							<Icon name="plus" size={13} stroke={2.2} /> Insert
						</button>
						<button type="button" class="imgup__chip imgup__chip--danger" on:click={() => removeUploadedImage(image.id)} title="Remove image">
							<Icon name="trash" size={13} stroke={2.2} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.imgup { display: flex; flex-direction: column; gap: 12px; }
	.dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 22px;
		border: 1.5px dashed var(--border-strong);
		border-radius: var(--r-sm);
		color: var(--text-3);
		font-size: 0.84rem;
		cursor: pointer;
		transition: border-color 0.16s, color 0.16s, background 0.16s;
	}
	.dropzone:hover,
	.dropzone.is-over {
		border-color: var(--accent);
		color: var(--accent-strong);
		background: var(--accent-soft);
	}
	.imgup__hint { font-family: var(--font-mono); font-size: 0.72rem; }
	.imgup__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 10px;
	}
	.imgup__thumb {
		position: relative;
		border-radius: var(--r-sm);
		overflow: hidden;
		border: 1px solid var(--border);
		aspect-ratio: 1;
	}
	.imgup__thumb img { width: 100%; height: 100%; object-fit: cover; }
	.imgup__thumb-actions {
		position: absolute;
		inset: auto 0 0 0;
		display: flex;
		gap: 6px;
		padding: 6px;
		background: linear-gradient(to top, oklch(0.2 0.02 265 / 0.7), transparent);
	}
	.imgup__chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.72rem;
		font-weight: 600;
		color: #fff;
		background: oklch(0.3 0.02 265 / 0.8);
		padding: 4px 8px;
		border-radius: 6px;
	}
	.imgup__chip--danger:hover { background: oklch(0.55 0.2 25); }
	.spin { display: inline-flex; animation: spin 1s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
