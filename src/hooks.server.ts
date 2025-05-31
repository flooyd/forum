import jwt from 'jsonwebtoken';
import { SECRET } from '$env/static/private';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import process from 'process';

// Ensure upload directory exists on server startup
const UPLOAD_DIR = resolve(process.cwd(), 'static', 'uploads');
if (!existsSync(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, { recursive: true })
        .then(() => console.log(`Created upload directory: ${UPLOAD_DIR}`))
        .catch(error => {
            console.error('Error creating upload directory:', error);
            console.error('Current working directory:', process.cwd());
            console.error('Attempted upload directory:', UPLOAD_DIR);
        });
}

export async function handle({ event, resolve }) {
    // Check if the request has a token in the headers
    const token = event.request.headers.get('Authorization')?.split(' ')[1];
    console.log('hook server token:', token);
    // If the token exists, verify it and attach the user to the event
    if (token) {
        try {
            const decoded = jwt.verify(token, SECRET) as {
                id: string;
                username: string;
                email: string;
                displayName: string;
                createdAt: Date;
                updatedAt: Date;
                lastOnline: Date;
                online: boolean;
            };
            event.locals.user = decoded;
        } catch (err) {
            console.error('Token verification failed:', err);
        }
    }

    // Continue with the request
    const response = await resolve(event);

    return response;
}