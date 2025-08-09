import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Check if build directory exists
const buildPath = join(__dirname, 'build');
if (!existsSync(buildPath)) {
	console.error('❌ Build directory not found! Please run "npm run build" first.');
	process.exit(1);
}

console.log('✅ Build directory found');
console.log('📁 Build directory contents:', readdirSync(buildPath));

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ 
		status: 'healthy', 
		timestamp: new Date().toISOString(),
		service: 'fuiz-enhanced',
		version: '2.2.0'
	});
});

// Try to serve SvelteKit build
try {
	// Check for the actual SvelteKit build structure
	const svelteKitPath = join(__dirname, '.svelte-kit', 'output', 'server');
	
	if (existsSync(svelteKitPath)) {
		console.log('✅ Found SvelteKit output directory');
		console.log('📁 SvelteKit contents:', readdirSync(svelteKitPath));
		
		// Try to import from the correct SvelteKit location
		const module = await import('./.svelte-kit/output/server/index.js');
		console.log('📦 Module keys:', Object.keys(module));
		
		// Try different ways to get the handler
		let handler = null;
		
		if (module.handler && typeof module.handler === 'function') {
			handler = module.handler;
		} else if (module.default && typeof module.default === 'function') {
			handler = module.default;
		} else if (module.default && module.default.handler && typeof module.default.handler === 'function') {
			handler = module.default.handler;
		} else if (typeof module === 'function') {
			handler = module;
		}
		
		if (handler) {
			app.use(handler);
			console.log('🚀 SvelteKit frontend enabled from .svelte-kit/output/server/');
		} else {
			throw new Error('No valid handler function found in module');
		}
	} else {
		// Try the build directory
		const module = await import('./build/handler.js');
		console.log('📦 Build module keys:', Object.keys(module));
		
		let handler = null;
		
		if (module.handler && typeof module.handler === 'function') {
			handler = module.handler;
		} else if (module.default && typeof module.default === 'function') {
			handler = module.default;
		} else if (module.default && module.default.handler && typeof module.default.handler === 'function') {
			handler = module.default.handler;
		} else if (typeof module === 'function') {
			handler = module;
		}
		
		if (handler) {
			app.use(handler);
			console.log('🚀 SvelteKit frontend enabled from build/handler.js');
		} else {
			throw new Error('No valid handler function found in build module');
		}
	}
	
} catch (error) {
	console.log('⚠️ Could not load SvelteKit handler:', error.message);
	console.log('📋 Full error:', error);
	
	// Fallback: serve static files and basic routes
	app.get('/', (req, res) => {
		res.json({ 
			message: 'Fuiz Enhanced Server is running!',
			status: 'operational',
			timestamp: new Date().toISOString(),
			version: '2.2.0',
			note: 'SvelteKit frontend failed to load',
			error: error.message
		});
	});

	app.get('/create', (req, res) => {
		res.json({ message: 'Create Quiz - Coming Soon' });
	});

	app.get('/host', (req, res) => {
		res.json({ message: 'Host Quiz - Coming Soon' });
	});

	app.get('/play', (req, res) => {
		res.json({ message: 'Join Quiz - Coming Soon' });
	});

	app.get('/admin', (req, res) => {
		res.json({ message: 'Admin Panel - Coming Soon' });
	});
}

// Start server
app.listen(port, '0.0.0.0', () => {
	console.log(`🚀 Fuiz Enhanced Server running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
	console.log(`🌐 Website: http://localhost:${port}`);
});
