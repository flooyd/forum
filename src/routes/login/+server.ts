//import db
import {db} from '$lib/server/db';
import bcrypt from 'bcrypt';
import { json, type ServerLoad } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { SECRET } from '$env/static/private';
import { usersTable } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

type User = {
    username: string;
    displayName: string;
    password: string;
    createdAt: Date;
    lastOnline: Date;
    online: boolean;
    email: string;
}

export async function POST({request}) {
    const data = await request.json();
    const username = data.username;
    const password = data.password;
    const email = data.email;
    const displayName = data.displayName;
    //check query params for login or register
    const loginOrRegister = data.loginOrRegister;

    if (loginOrRegister === 'login') {
        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.username, username)
        });

        if (!user) {
            return json({
                success: false,
                message: 'User does not exist'
            });
        }

        //check if password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return json({
                success: false,
                message: 'There was an error logging in.'
            });
        }

        //create token
        const token = jwt.sign({ id: user.id }, SECRET);

        return json({
            success: true,
            token,
            user
        });
    } else {
        //check if user or email already exists
        const userExists = await db.query.usersTable.findFirst({
            where: (usersTable: { username: any; }, { eq }: any) => eq(usersTable.username, username)
        });
        const emailExists = await db.query.usersTable.findFirst({
            where: (usersTable: { email: any; }, { eq }: any) => eq(usersTable.email, email)
        });

        if (userExists || emailExists) {
            return json({
                success: false,
                message: 'User or email already exists.'
            });
        }

        //hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user: User = {
            username,
            displayName,
            password: hashedPassword,
            createdAt: new Date(),
            lastOnline: new Date(),
            online: false,
            email
        };

        await db.insert(usersTable).values({
            username: user.username,
            displayName: user.displayName,
            password: user.password,
            createdAt: new Date(),
            lastOnline: new Date(),
            isOnline: 0,
            email: user.email,
            updatedAt: new Date(),
            avatar: null,
        });

        return json({
            success: true,
            message: 'User registered successfully',
            user
        });
    }
}
