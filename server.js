import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Simple health check
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
	res.json({ message: 'Fuiz Enhanced Server is running!' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
	console.log(`🚀 Server running on port ${port}`);
	console.log(`📊 Health check: http://localhost:${port}/health`);
});
