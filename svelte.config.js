import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		adapter: adapter(),
		
		// Optional: If you need to use a different base path for static assets
		paths: {
			base: '',
			assets: ''
		}
	}
};

export default config;