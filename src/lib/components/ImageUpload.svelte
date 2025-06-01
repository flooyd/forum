<script lang="ts">
    export let threadId: number | null = null;
    export let commentId: number | null = null;
    export let multiple = false;
    export let maxSize = 10; // MB
    export let accept = 'image/*';
    export let buttonText = 'Upload Image';
    export let disabled = false;
    
    // Callback props instead of events
    export let onImageUploaded: ((image: any) => void) | undefined = undefined;
    export let onImageInserted: ((data: { filename: string; altText: string; markdown: string; image: any }) => void) | undefined = undefined;
    export let onImageRemoved: ((data: { imageId: number }) => void) | undefined = undefined;
      let fileInput: HTMLInputElement;
    let uploading = false;
    let dragOver = false;
    let uploadedImages: any[] = [];    const handleFileSelect = async (files: FileList | null) => {
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
        
        if (threadId) {
            formData.append('threadId', threadId.toString());
        }
        if (commentId) {
            formData.append('commentId', commentId.toString());
        }
        
        const response = await fetch('/images', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
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
    
    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        dragOver = false;
        
        if (event.dataTransfer?.files) {
            handleFileSelect(event.dataTransfer.files);
        }
    };
    
    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        dragOver = true;
    };
    
    const handleDragLeave = (event: DragEvent) => {
        event.preventDefault();
        dragOver = false;
    };    const insertImageIntoTextarea = (image: any) => {
        const imageMarkdown = `![${image.alt}](${image.url})`;
        onImageInserted?.({ 
            filename: image.filename, 
            altText: image.alt,
            markdown: imageMarkdown, 
            image 
        });
    };
    
    const removeUploadedImage = async (imageId: number) => {
        try {
            const response = await fetch('/images', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ imageId })
            });
            
            const result = await response.json();            if (result.success) {
                uploadedImages = uploadedImages.filter(img => img.id !== imageId);
                onImageRemoved?.({ imageId });
            } else {
                alert('Error removing image: ' + result.message);
            }
        } catch (error) {
            console.error('Error removing image:', error);
            alert('Error removing image. Please try again.');
        }
    };
</script>

<div class="image-uploader">
    <div 
        class="drop-zone" 
        class:drag-over={dragOver}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        role="button"
        tabindex="0"
    >        <input
            bind:this={fileInput}
            type="file"
            {accept}
            {multiple}
            {disabled}
            on:change={(e) => handleFileSelect((e.target as HTMLInputElement)?.files)}
            style="display: none;"
        />
          <button 
            type="button"
            class="upload-button"
            {disabled}
            on:click={() => fileInput.click()}
        >
            {#if uploading}
                Uploading...
            {:else}
                {buttonText}
            {/if}
        </button>
        
        <p class="drop-text">
            or drag and drop images here
        </p>
        
        <p class="file-info">
            Max size: {maxSize}MB • Supported: JPEG, PNG, GIF, WebP
        </p>    </div>
    
    {#if uploadedImages.length > 0}
        <div class="uploaded-images">
            <h4>Uploaded Images:</h4>
            <div class="image-grid">
                {#each uploadedImages as image (image.id)}
                    <div class="image-item">
                        <img src={image.url} alt={image.alt} />                        <div class="image-actions">
                            <button 
                                type="button"
                                class="insert-button"
                                on:click={() => insertImageIntoTextarea(image)}
                                title="Insert into text"
                            >
                                Insert
                            </button>
                            <button 
                                type="button"
                                class="remove-button"
                                on:click={() => removeUploadedImage(image.id)}
                                title="Remove image"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<style>
    .image-uploader {
        margin: 10px 0;
    }
    
    .drop-zone {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        background: #f9f9f9;
    }
    
    .drop-zone.drag-over {
        border-color: #007bff;
        background: #e3f2fd;
    }
    
    .upload-button {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 10px;
    }
    
    .upload-button:hover:not(:disabled) {
        background: #0056b3;
    }
    
    .upload-button:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }
    
    .drop-text {
        margin: 10px 0 5px 0;
        color: #666;
        font-size: 14px;
    }
      .file-info {
        margin: 0;
        color: #888;
        font-size: 12px;
    }
    
    .uploaded-images {
        margin-top: 15px;
    }
    
    .uploaded-images h4 {
        margin: 0 0 10px 0;
        color: #333;
    }
    
    .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 10px;
    }
    
    .image-item {
        position: relative;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .image-item img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
    }
    
    .image-actions {
        position: absolute;
        top: 5px;
        right: 5px;
        display: flex;
        gap: 5px;
    }
    
    .insert-button {
        background: #28a745;
        color: white;
        border: none;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    }
    
    .insert-button:hover {
        background: #1e7e34;
    }
    
    .remove-button {
        background: #dc3545;
        color: white;
        border: none;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    }
    
    .remove-button:hover {
        background: #c82333;
    }
    
    /* Dark theme adjustments */
    :global(.dark) .drop-zone {
        background: #333;
        border-color: #666;
        color: #fff;
    }
    
    :global(.dark) .drop-zone.drag-over {
        border-color: #007bff;
        background: #1a1a2e;
    }
    
    :global(.dark) .drop-text,
    :global(.dark) .file-info {
        color: #ccc;
    }
    
    :global(.dark) .image-item {
        border-color: #666;
    }
    
    :global(.dark) .uploaded-images h4 {
        color: #fff;
    }
</style>
