import { db } from '$lib/server/db';
import { imagesTable } from '$lib/server/db/schema.js';
import { checkAdminAuth } from '$lib/server/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const UPLOAD_DIR = 'static/uploads';

// Track if directory has been checked to avoid repeated file system calls
let directoryChecked = false;

async function ensureUploadDirectory(): Promise<void> {
    if (directoryChecked) return;
    
    if (!existsSync(UPLOAD_DIR)) {
        try {
            await mkdir(UPLOAD_DIR, { recursive: true });
            console.log(`Created upload directory: ${UPLOAD_DIR}`);
        } catch (error) {
            console.error('Error creating upload directory:', error);
            throw new Error('Failed to create upload directory');
        }
    }
    
    directoryChecked = true;
}

// Initialize upload directory on module load
ensureUploadDirectory().catch(console.error);

async function processImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // For GIFs, don't process to preserve animation
    if (mimeType === 'image/gif') {
        return buffer;
    }

    // Process other images: resize if too large, optimize quality
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if width > 1920px or height > 1080px
    if (metadata.width && metadata.height && (metadata.width > 1920 || metadata.height > 1080)) {
        image.resize(1920, 1080, { 
            fit: 'inside', 
            withoutEnlargement: true 
        });
    }

    // Convert to WebP for better compression (except for PNG with transparency)
    if (mimeType === 'image/png' && metadata.hasAlpha) {
        return await image.png({ quality: 90 }).toBuffer();
    } else {
        return await image.webp({ quality: 85 }).toBuffer();
    }
}

export const POST = async ({ request, locals }) => {
    try {
        // Check if user is authenticated
        if (!locals.user) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Authentication required' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;
        const alt = formData.get('alt') as string || '';
        const threadId = formData.get('threadId') as string;
        const commentId = formData.get('commentId') as string;

        if (!file || file.size === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'No file provided' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'File too large. Maximum size is 10MB.' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }        // Generate unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const storedFilename = `${uuidv4()}.${fileExtension}`;
        const filePath = join(UPLOAD_DIR, storedFilename);

        // Ensure upload directory exists
        await ensureUploadDirectory();

        // Process image
        const buffer = Buffer.from(await file.arrayBuffer());
        const processedBuffer = await processImage(buffer, file.type);

        // Save file to disk
        await writeFile(filePath, processedBuffer);

        // Save metadata to database
        const imageRecord = await db
            .insert(imagesTable)
            .values({
                filename: file.name,
                storedFilename,
                mimeType: file.type,
                size: processedBuffer.length,
                uploadedBy: Number(locals.user.id),
                threadId: threadId ? Number(threadId) : null,
                commentId: commentId ? Number(commentId) : null,
                alt: alt || file.name,
                createdAt: new Date()
            })
            .returning();

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Image uploaded successfully',
            image: {
                id: imageRecord[0].id,
                url: `/uploads/${storedFilename}`,
                alt: imageRecord[0].alt,
                filename: imageRecord[0].filename
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error uploading image' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const GET = async ({ url, locals }) => {
    try {
        // Check authentication
        if (!locals.user) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Authentication required' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const threadId = url.searchParams.get('threadId');
        const commentId = url.searchParams.get('commentId');
        const userId = url.searchParams.get('userId');

        let whereClause: any = { isDeleted: 0 };

        if (threadId) {
            whereClause.threadId = Number(threadId);
        }
        if (commentId) {
            whereClause.commentId = Number(commentId);
        }
        if (userId) {
            whereClause.uploadedBy = Number(userId);
        }

        const images = await db
            .select({
                id: imagesTable.id,
                filename: imagesTable.filename,
                storedFilename: imagesTable.storedFilename,
                mimeType: imagesTable.mimeType,
                size: imagesTable.size,
                alt: imagesTable.alt,
                createdAt: imagesTable.createdAt,
                threadId: imagesTable.threadId,
                commentId: imagesTable.commentId
            })
            .from(imagesTable)
            .where(whereClause)
            .orderBy(imagesTable.createdAt);        const formattedImages = images.map((img: any) => ({
            ...img,
            url: `/uploads/${img.storedFilename}`
        }));

        return new Response(JSON.stringify({ 
            success: true, 
            images: formattedImages 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error fetching images:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error fetching images' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });    }
};

export const PUT = async ({ request, locals }) => {
    try {
        // Check authentication
        if (!locals.user) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Authentication required' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { imageId, threadId, commentId } = await request.json();

        if (!imageId) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Image ID is required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get image details to verify ownership
        const image = await db.query.imagesTable.findFirst({
            where: eq(imagesTable.id, Number(imageId))
        });

        if (!image) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Image not found' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user owns the image
        if (image.uploadedBy !== Number(locals.user.id)) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Unauthorized to update this image' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update image associations
        const updateData: any = {};
        if (threadId !== undefined) updateData.threadId = threadId ? Number(threadId) : null;
        if (commentId !== undefined) updateData.commentId = commentId ? Number(commentId) : null;

        await db
            .update(imagesTable)
            .set(updateData)
            .where(eq(imagesTable.id, Number(imageId)));

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Image updated successfully' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error updating image:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error updating image' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const DELETE = async ({ request, locals }) => {
    try {
        // Check authentication
        if (!locals.user) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Authentication required' 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { imageId } = await request.json();

        if (!imageId) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Image ID is required' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }        // Get image details
        const image = await db.query.imagesTable.findFirst({
            where: eq(imagesTable.id, Number(imageId))
        });

        if (!image) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Image not found' 
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user owns the image or is admin
        const auth = await checkAdminAuth(locals);
        if (image.uploadedBy !== Number(locals.user.id) && !auth.isAdmin) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'Unauthorized to delete this image' 
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Soft delete the image
        await db
            .update(imagesTable)
            .set({ isDeleted: 1 })
            .where(eq(imagesTable.id, Number(imageId)));

        return new Response(JSON.stringify({ 
            success: true, 
            message: 'Image deleted successfully' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error deleting image:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: 'Error deleting image' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
