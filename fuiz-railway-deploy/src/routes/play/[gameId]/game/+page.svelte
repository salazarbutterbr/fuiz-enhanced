<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import socketManager from '$lib/socket.js';
  import { LanguageManager } from '$lib/utils/languageManager.js';
  import { TranslationManager } from '$lib/utils/translationManager.js';
  import type { AvailableLanguageTag } from '$lib/types';

  const gameId = $page.params.gameId;
  
  // Game state
  let quiz: any = null;
  let currentSlide = 0;
  let timeLeft = 30;
  let isAnswering = false;
  let selectedAnswer = '';
  let typedAnswer = '';
  let participantId = '';
  let nickname = '';
  let language: AvailableLanguageTag = 'en';
  let leaderboard: any[] = [];
  let participantStats: any = null;
  let gameStatus = 'waiting'; // waiting, active, finished
  let errorMessage = '';
  let connectionStatus = 'connecting';
  
  // Timer
  let timerInterval: number;
  
  onMount(async () => {
    // Get participant info from session storage
    nickname = sessionStorage.getItem('fuiz_nickname') || '';
    language = (sessionStorage.getItem('fuiz_language') as AvailableLanguageTag) || 'en';
    
    if (!nickname) {
      goto(`/play/${gameId}`);
      return;
    }
    
    // Connect to socket
    socketManager.connect();
    
    // Join quiz
    socketManager.joinQuiz(gameId, nickname, language);
    
    // Setup socket listeners
    setupSocketListeners();
    
    // Start connection status check
    checkConnectionStatus();
  });
  
  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    socketManager.disconnect();
  });
  
  function setupSocketListeners() {
    // Quiz info received
    socketManager.on('quiz-info', (data) => {
      quiz = data.quiz;
      participantId = data.participant.id;
      connectionStatus = 'connected';
    });
    
    // Quiz started
    socketManager.on('quiz-started', () => {
      gameStatus = 'active';
      startTimer();
    });
    
    // Quiz ended
    socketManager.on('quiz-ended', () => {
      gameStatus = 'finished';
      if (timerInterval) clearInterval(timerInterval);
      getFinalStats();
    });
    
    // Slide changed
    socketManager.on('slide-changed', (data) => {
      currentSlide = data.currentSlide;
      timeLeft = quiz?.slides[currentSlide]?.timeLimit || 30;
      isAnswering = false;
      selectedAnswer = '';
      typedAnswer = '';
      startTimer();
    });
    
    // Answer confirmed
    socketManager.on('answer-confirmed', (data) => {
      isAnswering = false;
      if (data.isCorrect) {
        // Show success feedback
        showFeedback('correct', data.points);
      } else {
        // Show error feedback
        showFeedback('incorrect', 0);
      }
    });
    
    // Leaderboard update
    socketManager.on('leaderboard', (data) => {
      leaderboard = data;
    });
    
    // Participant stats
    socketManager.on('participant-stats', (data) => {
      participantStats = data;
    });
    
    // Error handling
    socketManager.on('error', (data) => {
      errorMessage = data.message;
      setTimeout(() => {
        errorMessage = '';
      }, 5000);
    });
    
    // Participant joined
    socketManager.on('participant-joined', (data) => {
      console.log(`${data.participant.nickname} joined the quiz`);
    });
  }
  
  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
      } else {
        // Time's up, auto-submit if not answered
        if (!isAnswering && selectedAnswer) {
          submitAnswer();
        }
        clearInterval(timerInterval);
      }
    }, 1000);
  }
  
  function submitAnswer() {
    if (isAnswering || !quiz?.slides[currentSlide]) return;
    
    const slide = quiz.slides[currentSlide];
    const startTime = Date.now();
    const responseTime = startTime - (slide.startTime || startTime);
    
    isAnswering = true;
    
    if (slide.type === 'multiple_choice') {
      socketManager.submitAnswer(slide.id, selectedAnswer, responseTime);
    } else if (slide.type === 'type_answer') {
      socketManager.submitAnswer(slide.id, typedAnswer, responseTime);
    }
  }
  
  function showFeedback(type: 'correct' | 'incorrect', points: number) {
    // Visual feedback for answer
    const feedback = document.createElement('div');
    feedback.className = `fixed inset-0 flex items-center justify-center z-50 ${type === 'correct' ? 'bg-green-500' : 'bg-red-500'} bg-opacity-75`;
    feedback.innerHTML = `
      <div class="bg-white p-8 rounded-lg text-center">
        <h2 class="text-2xl font-bold ${type === 'correct' ? 'text-green-600' : 'text-red-600'}">
          ${type === 'correct' ? '✅ Correct!' : '❌ Incorrect'}
        </h2>
        <p class="text-lg mt-2">${points} points</p>
      </div>
    `;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 2000);
  }
  
  function getFinalStats() {
    socketManager.getParticipantStats();
    socketManager.getLeaderboard(quiz?.id);
  }
  
  function checkConnectionStatus() {
    setInterval(() => {
      if (socketManager.isConnected()) {
        connectionStatus = 'connected';
      } else {
        connectionStatus = 'disconnected';
      }
    }, 1000);
  }
  
  function leaveQuiz() {
    if (confirm('Are you sure you want to leave the quiz?')) {
      socketManager.disconnect();
      goto('/');
    }
  }
  
  // Get current slide with translation
  $: currentSlideData = quiz?.slides[currentSlide] ? 
    TranslationManager.getSlideInLanguage(quiz.slides[currentSlide], language) : null;
  
  // Format time
  $: formattedTime = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
</script>

<svelte:head>
  <title>Playing Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-4">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-gray-900">{quiz?.title || 'Loading...'}</h1>
          <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {LanguageManager.getLanguageName(language)}
          </span>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Connection Status -->
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 rounded-full {connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}"></div>
            <span class="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>
          
          <!-- Timer -->
          {#if gameStatus === 'active' && timeLeft > 0}
            <div class="text-lg font-mono font-bold {timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'}">
              {formattedTime}
            </div>
          {/if}
          
          <!-- Leave Button -->
          <button 
            on:click={leaveQuiz}
            class="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
          >
            Leave Quiz
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if errorMessage}
      <div class="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      </div>
    {/if}

    {#if gameStatus === 'waiting'}
      <!-- Waiting for quiz to start -->
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 class="mt-4 text-xl font-semibold text-gray-900">Waiting for host to start the quiz...</h2>
        <p class="mt-2 text-gray-600">You're all set! The host will begin shortly.</p>
      </div>
    {:else if gameStatus === 'active' && currentSlideData}
      <!-- Active quiz question -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Question Area -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-lg p-8">
            <!-- Question Header -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <span class="text-sm font-medium text-gray-500">Question {currentSlide + 1} of {quiz.slides.length}</span>
                <span class="text-sm font-medium text-gray-500">{currentSlideData.points} points</span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-2">{currentSlideData.title}</h2>
              {#if currentSlideData.content.question}
                <p class="text-lg text-gray-700">{currentSlideData.content.question}</p>
              {/if}
            </div>

            <!-- Answer Options -->
            {#if currentSlideData.type === 'multiple_choice'}
              <div class="space-y-3">
                {#each currentSlideData.content.answers as answer, index}
                  <button
                    on:click={() => selectedAnswer = answer.content.Text}
                    class="w-full p-4 text-left border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 {selectedAnswer === answer.content.Text ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}"
                    disabled={isAnswering}
                  >
                    <div class="flex items-center">
                      <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 {selectedAnswer === answer.content.Text ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}">
                        {#if selectedAnswer === answer.content.Text}
                          <div class="w-2 h-2 bg-white rounded-full"></div>
                        {/if}
                      </div>
                      <span class="text-lg">{answer.content.Text}</span>
                    </div>
                  </button>
                {/each}
              </div>
            {:else if currentSlideData.type === 'type_answer'}
              <div class="space-y-4">
                <input
                  bind:value={typedAnswer}
                  type="text"
                  placeholder="Type your answer..."
                  class="w-full p-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isAnswering}
                />
              </div>
            {/if}

            <!-- Submit Button -->
            <div class="mt-8">
              <button
                on:click={submitAnswer}
                disabled={isAnswering || (!selectedAnswer && !typedAnswer)}
                class="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnswering ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Participant Info -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Your Info</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Nickname:</span>
                <span class="font-medium">{nickname}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Language:</span>
                <span class="font-medium">{LanguageManager.getLanguageName(language)}</span>
              </div>
              {#if participantStats}
                <div class="flex justify-between">
                  <span class="text-gray-600">Score:</span>
                  <span class="font-medium">{participantStats.totalPoints}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Accuracy:</span>
                  <span class="font-medium">{participantStats.accuracy.toFixed(1)}%</span>
                </div>
              {/if}
            </div>
          </div>

          <!-- Leaderboard -->
          {#if leaderboard.length > 0}
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h3>
              <div class="space-y-2">
                {#each leaderboard.slice(0, 10) as participant, index}
                  <div class="flex justify-between items-center p-2 rounded {participant.nickname === nickname ? 'bg-blue-50' : ''}">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span class="text-sm font-medium {participant.nickname === nickname ? 'text-blue-600' : 'text-gray-900'}">
                        {participant.nickname}
                      </span>
                    </div>
                    <span class="text-sm font-semibold text-gray-900">{participant.totalPoints}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else if gameStatus === 'finished'}
      <!-- Quiz finished -->
      <div class="text-center py-12">
        <div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Quiz Finished!</h2>
          <p class="text-lg text-gray-600 mb-8">Thanks for participating!</p>
          
          {#if participantStats}
            <div class="grid grid-cols-2 gap-6 mb-8">
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600">{participantStats.totalPoints}</div>
                <div class="text-sm text-gray-600">Total Score</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-green-600">{participantStats.accuracy.toFixed(1)}%</div>
                <div class="text-sm text-gray-600">Accuracy</div>
              </div>
            </div>
          {/if}
          
          <button
            on:click={() => goto('/')}
            class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    {:else}
      <!-- Loading -->
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <h2 class="mt-4 text-xl font-semibold text-gray-900">Loading quiz...</h2>
      </div>
    {/if}
  </main>
</div>

<style>
  /* Custom styles for better UX */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
