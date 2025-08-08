import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],
	preprocess: [
		vitePreprocess()
	],

	compilerOptions: {
		warningFilter: (warning) => {
			if (warning.code === 'attribute_quoted') {
				return false;
			}
			return true;
		}
	},

	kit: {
		adapter: adapter({
			precompress: false,
			envPrefix: ''
		}),

		paths: {
			relative: false
		},

		prerender: {
			origin: 'https://your-app.railway.app'
		},

		// Add proper server configuration
		server: {
			port: process.env.PORT || 3000,
			host: '0.0.0.0'
		}
	}
};

export default config;
