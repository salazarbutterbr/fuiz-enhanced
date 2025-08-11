<script lang="ts">
	import { onMount } from 'svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

	let answered = $state(false);

	onMount(() => {
		answered = (localStorage.getItem('answered') ?? '').length > 0;
	});

	function previewQuiz() {
		// Navigate to a demo quiz
		window.location.href = '/play/GAME0001';
	}
</script>

<svelte:head>
	<title>Fuiz | Host Live Quizzes Freely</title>
	<meta property="og:title" content="Fuiz | Host Live Quizzes Freely" />
	<meta name="description" content="A free online platform for hosting and playing live quizzes" />
	<meta property="og:description" content="A free online platform for hosting and playing live quizzes" />
</svelte:head>

<main class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-white">Fuiz</h1>
				</div>
				<div class="flex items-center space-x-4">
					<DarkModeToggle />
					<a href="/create" class="text-white/80 hover:text-white transition-colors">
						Create Quiz
					</a>
					<a href="/host" class="text-white/80 hover:text-white transition-colors">
						Host Quiz
					</a>
				</div>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="py-20 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-5xl font-bold text-white mb-6 leading-tight">
				Host Live Quizzes
				<span class="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Freely</span>
			</h2>
			<p class="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
				A beautiful, free online platform for hosting and playing live quizzes with real-time interaction
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/create" class="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black">
					Create Your First Quiz
				</a>
				<button
					on:click={previewQuiz}
					class="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black border border-white/20"
				>
					Preview Quiz
				</button>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8">
		<div class="max-w-7xl mx-auto">
			<h3 class="text-3xl font-bold text-center text-white mb-12">
				Why Choose Fuiz?
			</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
					<div class="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
						</svg>
					</div>
					<h4 class="text-xl font-semibold text-white mb-2">Free Forever</h4>
					<p class="text-white/60">No hidden costs, no premium features. Everything is completely free.</p>
				</div>
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
					<div class="w-16 h-16 bg-green-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<h4 class="text-xl font-semibold text-white mb-2">Real-time Interaction</h4>
					<p class="text-white/60">Live results, instant feedback, and engaging participant interaction.</p>
				</div>
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
					<div class="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h4 class="text-xl font-semibold text-white mb-2">Easy to Use</h4>
					<p class="text-white/60">Simple interface, quick setup, and intuitive quiz creation process.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8">
		<div class="max-w-4xl mx-auto text-center">
			<h3 class="text-3xl font-bold text-white mb-4">
				Ready to Get Started?
			</h3>
			<p class="text-xl text-white/60 mb-8">
				Create your first quiz in minutes and start engaging with your audience
			</p>
			<a href="/create" class="px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black">
				Create Quiz Now
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-gray-900/50 border-t border-white/10">
		<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<p class="text-white/60">
					© 2024 Fuiz. Made with ❤️ for the community.
				</p>
			</div>
		</div>
	</footer>
</main>
