// Simple test script to verify server functionality
import { createServer } from 'http';

const testServer = createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({
		status: 'test-healthy',
		timestamp: new Date().toISOString(),
		message: 'Test server is working'
	}));
});

const port = process.env.PORT || 3000;
testServer.listen(port, '0.0.0.0', () => {
	console.log(`🧪 Test server running on port ${port}`);
	console.log(`📊 Test health check: http://localhost:${port}/`);
});

// Auto-shutdown after 5 seconds
setTimeout(() => {
	console.log('🛑 Shutting down test server');
	testServer.close();
	process.exit(0);
}, 5000);
