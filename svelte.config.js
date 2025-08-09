import adapter from '@sveltejs/adapter-static';
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
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),

		paths: {
			relative: false
		}
	}
};

export default config;
