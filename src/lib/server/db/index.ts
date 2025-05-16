import { drizzle } from 'drizzle-orm/postgres-js';
import {drizzle as drizzleNeon} from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';

let db: any;
if(env.DATABASE_URL.includes('neon')) {
    const client = neon(env.DATABASE_URL!)
    db = drizzleNeon(client, { schema });
    
} else {
    const client = postgres(env.DATABASE_URL);
    db = drizzle(client, { schema });
}

export { db };
