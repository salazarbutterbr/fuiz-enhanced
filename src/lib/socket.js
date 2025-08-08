// Simplified socket manager
class SocketManager {
	constructor() {
		this.socket = null;
		this.isConnected = false;
		this.listeners = new Map();
	}

	connect(gameId) {
		// In a real implementation, this would connect to a WebSocket server
		console.log(`Connecting to game: ${gameId}`);
		this.isConnected = true;
	}

	disconnect() {
		this.isConnected = false;
		this.socket = null;
	}

	emit(event, data) {
		if (this.isConnected) {
			console.log(`Emitting ${event}:`, data);
		}
	}

	on(event, callback) {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, []);
		}
		this.listeners.get(event).push(callback);
	}

	off(event, callback) {
		if (this.listeners.has(event)) {
			const callbacks = this.listeners.get(event);
			const index = callbacks.indexOf(callback);
			if (index > -1) {
				callbacks.splice(index, 1);
			}
		}
	}
}

const socketManager = new SocketManager();
export default socketManager;
