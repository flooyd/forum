// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				username: string;
				email: string;
				displayName: string;
				createdAt: Date;
				updatedAt: Date;
				lastOnline: Date;
				online: boolean;
			} | null;
			token: string | null;
		}
		interface Platform {}
		interface PrivateEnv {
			SECRET: string;
			DB_URI: string;
		}
		interface PublicEnv {}
	}
}

export {};
