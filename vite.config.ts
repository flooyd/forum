import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: ['.']
		}
	}
});
