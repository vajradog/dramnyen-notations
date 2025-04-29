import adapter from '@sveltejs/adapter-static'; // Changed from adapter-auto

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// Using static adapter for GitHub Pages
		adapter: adapter({
			// Output directory for the build
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'
			precompress: false
		}),
		
		// Set the base path to your repository name for GitHub Pages
		// Replace 'your-repo-name' with your actual repository name
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/dramnyen-notations' : '',
			assets: ''
		}
	}
};

export default config;