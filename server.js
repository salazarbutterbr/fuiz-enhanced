import { handler } from './build/handler.js';
import express from 'express';

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

// Let SvelteKit handle everything else
app.use(handler);

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
	console.log(`🚀 Fuiz Enhanced Server running on port ${port}`);
	console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`📊 Health check available at: http://localhost:${port}/health`);
});
