import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

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
	// Import the SvelteKit handler
	const { handler } = await import('./build/handler.js');
	console.log('✅ SvelteKit handler loaded successfully');
	
	// Use SvelteKit handler for all routes
	app.use(handler);
	
	console.log('🚀 SvelteKit frontend enabled');
} catch (error) {
	console.log('⚠️ Could not load SvelteKit handler, using fallback mode:', error.message);
	
	// Fallback: serve static files and basic routes
	app.get('/', (req, res) => {
		res.json({ 
			message: 'Fuiz Enhanced Server is running!',
			status: 'operational',
			timestamp: new Date().toISOString(),
			version: '2.2.0'
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
