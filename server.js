import { handler } from './build/handler.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if build directory exists
const buildPath = join(__dirname, 'build');
if (!existsSync(buildPath)) {
	console.error('❌ Build directory not found! Please run "npm run build" first.');
	process.exit(1);
}

console.log('✅ Build directory found');

const app = express();

// Add health check endpoint
app.get('/health', (req, res) => {
	console.log('Health check requested at:', new Date().toISOString());
	res.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		service: 'fuiz-enhanced',
		version: '2.2.0',
		environment: process.env.NODE_ENV || 'development'
	});
});

// Add a simple root endpoint for testing
app.get('/', (req, res) => {
	res.json({ message: 'Fuiz Enhanced Server is running!' });
});

// Let SvelteKit handle everything else
app.use(handler);

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Bind to all interfaces

console.log(`🚀 Starting Fuiz Enhanced Server...`);
console.log(`📊 Port: ${port}`);
console.log(`🌍 Host: ${host}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

app.listen(port, host, () => {
	console.log(`✅ Server started successfully!`);
	console.log(`🌐 Server running at: http://${host}:${port}`);
	console.log(`📊 Health check available at: http://${host}:${port}/health`);
}).on('error', (error) => {
	console.error('❌ Server failed to start:', error);
	process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
	console.log('🛑 SIGTERM received, shutting down gracefully');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('🛑 SIGINT received, shutting down gracefully');
	process.exit(0);
});
