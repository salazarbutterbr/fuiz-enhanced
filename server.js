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

// Serve static files from SvelteKit build
const staticPath = join(__dirname, 'build', 'client');
if (existsSync(staticPath)) {
	console.log('✅ Found SvelteKit client build');
	app.use(express.static(staticPath));
	console.log('🚀 Serving static files from:', staticPath);
} else {
	console.log('⚠️ No client build found, using fallback');
}

// Serve the main HTML file for all routes (SPA)
app.get('*', (req, res) => {
	const indexPath = join(__dirname, 'build', 'client', 'index.html');
	if (existsSync(indexPath)) {
		res.sendFile(indexPath);
	} else {
		// Fallback response
		res.json({ 
			message: 'Fuiz Enhanced Server is running!',
			status: 'operational',
			timestamp: new Date().toISOString(),
			version: '2.2.0',
			note: 'Static files not found'
		});
	}
});

// Start server
app.listen(port, '0.0.0.0', () => {
	console.log(`🚀 Fuiz Enhanced Server running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
	console.log(`🌐 Website: http://localhost:${port}`);
});
