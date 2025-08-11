<script lang="ts">
	import { goto } from '$app/navigation';

	let gameId = '';
	let error = '';

	function joinGame() {
		if (!gameId.trim()) {
			error = 'Please enter a game ID';
			return;
		}

		// Navigate to the game
		goto(`/play/${gameId.trim()}`);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			joinGame();
		}
	}
</script>

<svelte:head>
	<title>Join Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black/80 backdrop-blur-xl border-b border-white/10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-white">Fuiz</h1>
				</div>
				<div class="flex items-center space-x-4">
					<a href="/create" class="text-white/80 hover:text-white transition-colors">
						Create Quiz
					</a>
					<a href="/host" class="text-white/80 hover:text-white transition-colors">
						Host
					</a>
					<a href="/" class="text-white/80 hover:text-white transition-colors">
						Home
					</a>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-md mx-auto px-4 py-16">
		<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
			<div class="text-center mb-8">
				<h2 class="text-3xl font-bold text-white mb-2">
					🎯 Join Quiz
				</h2>
				<p class="text-white/60">
					Enter the game ID to join a quiz
				</p>
			</div>

			<form on:submit|preventDefault={joinGame} class="space-y-6">
				<div>
					<label for="gameId" class="block text-sm font-medium text-white/80 mb-2">
						Game ID
					</label>
					<input
						id="gameId"
						type="text"
						bind:value={gameId}
						on:keydown={handleKeydown}
						placeholder="e.g., GAME0001"
						class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
						required
					/>
				</div>

				{#if error}
					<div class="text-red-400 text-sm bg-red-900/20 border border-red-500/20 p-3 rounded-xl">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={!gameId.trim()}
					class="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
				>
					Join Game
				</button>
			</form>

			<!-- Demo Game IDs -->
			<div class="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
				<h3 class="text-sm font-medium text-white/80 mb-3">Try these demo games:</h3>
				<div class="space-y-2">
					<button
						on:click={() => { gameId = 'GAME0001'; joinGame(); }}
						class="w-full text-left p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
					>
						GAME0001 - Math Quiz
					</button>
					<button
						on:click={() => { gameId = 'GAME0002'; joinGame(); }}
						class="w-full text-left p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
					>
						GAME0002 - Geography Quiz
					</button>
				</div>
			</div>
		</div>
	</main>
</div>
