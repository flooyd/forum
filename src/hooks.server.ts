import jwt from 'jsonwebtoken';
import { SECRET } from '$env/static/private';

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