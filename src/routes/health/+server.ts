import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	console.log('Health check requested at:', new Date().toISOString());
	
	return json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		service: 'fuiz-enhanced',
		version: '2.2.0',
		environment: process.env.NODE_ENV || 'development'
	});
};
