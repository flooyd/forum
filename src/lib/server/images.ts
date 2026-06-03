import { db } from '$lib/server/db';
import { imagesTable } from '$lib/server/db/schema.js';
import { inArray } from 'drizzle-orm';
import { del } from '@vercel/blob';

type ImageRef = { id: number; storedFilename: string | null };

// Hard-delete image rows and remove their backing blobs. Used when a parent
// thread or comment is deleted, so cascading removes the attached images too.
export async function deleteImages(images: ImageRef[]) {
    if (images.length === 0) return;

    // Remove the underlying blobs first; keep going even if a blob delete fails.
    await Promise.all(
        images.map(async (image) => {
            if (image.storedFilename && image.storedFilename.includes('vercel-storage.com')) {
                try {
                    await del(image.storedFilename);
                } catch (blobError) {
                    console.warn('Failed to delete from Vercel Blob:', blobError);
                }
            }
        })
    );

    await db.delete(imagesTable).where(
        inArray(imagesTable.id, images.map((image) => image.id))
    );
}
