<script lang="ts">
  import { onMount } from 'svelte';
  import { LanguageManager } from '$lib/utils/languageManager.js';

  // Dashboard state
  let activeTab = 'overview';
  let systemStatus = {
    backend: 'checking',
    database: 'checking',
    frontend: 'checking',
    participants: 0,
    activeQuizzes: 0
  };
  
  let quizzes: any[] = [];
  let participants: any[] = [];
  let exports: any[] = [];
  let logs: string[] = [];
  let settings = {
    maxParticipants: 500,
    defaultLanguage: 'en',
    autoBackup: true,
    emailNotifications: false
  };
  
  let isLoading = false;
  let message = '';

  onMount(async () => {
    await checkSystemStatus();
    await loadDashboardData();
  });

  async function checkSystemStatus() {
    try {
      // Check backend health
      const backendResponse = await fetch('/health');
      systemStatus.backend = backendResponse.ok ? 'healthy' : 'error';
      
      // Check database
      const dbResponse = await fetch('/api/status');
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        systemStatus.database = 'healthy';
        systemStatus.participants = dbData.totalParticipants || 0;
        systemStatus.activeQuizzes = dbData.activeQuizzes || 0;
      } else {
        systemStatus.database = 'error';
      }
      
      systemStatus.frontend = 'healthy';
    } catch (error) {
      systemStatus.backend = 'error';
      systemStatus.database = 'error';
    }
  }

  async function loadDashboardData() {
    isLoading = true;
    try {
      // Load quizzes
      const quizzesResponse = await fetch('/api/quiz');
      if (quizzesResponse.ok) {
        const data = await quizzesResponse.json();
        quizzes = data.quizzes || [];
      }
      
      // Load recent participants
      const participantsResponse = await fetch('/api/participants/recent');
      if (participantsResponse.ok) {
        const data = await participantsResponse.json();
        participants = data.participants || [];
      }
      
      // Load recent exports
      const exportsResponse = await fetch('/api/exports/recent');
      if (exportsResponse.ok) {
        const data = await exportsResponse.json();
        exports = data.exports || [];
      }
      
      // Load recent logs
      const logsResponse = await fetch('/api/logs/recent');
      if (logsResponse.ok) {
        const data = await logsResponse.json();
        logs = data.logs || [];
      }
    } catch (error) {
      message = 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  }

  async function startQuiz(quizId: string) {
    try {
      const response = await fetch(`/api/quiz/${quizId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (response.ok) {
        message = 'Quiz started successfully!';
        await loadDashboardData();
      } else {
        message = 'Failed to start quiz';
      }
    } catch (error) {
      message = 'Error starting quiz';
    }
  }

  async function stopQuiz(quizId: string) {
    try {
      const response = await fetch(`/api/quiz/${quizId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      if (response.ok) {
        message = 'Quiz stopped successfully!';
        await loadDashboardData();
      } else {
        message = 'Failed to stop quiz';
      }
    } catch (error) {
      message = 'Error stopping quiz';
    }
  }

  async function deleteQuiz(quizId: string) {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        message = 'Quiz deleted successfully!';
        await loadDashboardData();
      } else {
        message = 'Failed to delete quiz';
      }
    } catch (error) {
      message = 'Error deleting quiz';
    }
  }

  async function exportQuizData(quizId: string, type: string) {
    try {
      const response = await fetch(`/api/export/${quizId}/${type}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_${quizId}_${type}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        message = 'Export completed successfully!';
      } else {
        message = 'Failed to export data';
      }
    } catch (error) {
      message = 'Error exporting data';
    }
  }

  async function updateSettings() {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        message = 'Settings updated successfully!';
      } else {
        message = 'Failed to update settings';
      }
    } catch (error) {
      message = 'Error updating settings';
    }
  }

  async function createBackup() {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        message = `Backup created successfully! Location: ${data.backupPath}`;
      } else {
        message = 'Failed to create backup';
      }
    } catch (error) {
      message = 'Error creating backup';
    }
  }

  async function restartServices() {
    if (!confirm('Are you sure you want to restart all services? This will temporarily disconnect all participants.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/restart', {
        method: 'POST'
      });
      
      if (response.ok) {
        message = 'Services restarting... Please wait a moment and refresh the page.';
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        message = 'Failed to restart services';
      }
    } catch (error) {
      message = 'Error restarting services';
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  }
</script>

<svelte:head>
  <title>Admin Dashboard - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <div class="flex items-center space-x-4">
          <button
            on:click={checkSystemStatus}
            class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Message -->
  {#if message}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p class="text-sm text-blue-800">{message}</p>
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8">
        <button
          on:click={() => activeTab = 'overview'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Overview
        </button>
        <button
          on:click={() => activeTab = 'quizzes'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'quizzes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Quizzes
        </button>
        <button
          on:click={() => activeTab = 'participants'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'participants' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Participants
        </button>
        <button
          on:click={() => activeTab = 'exports'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'exports' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Exports
        </button>
        <button
          on:click={() => activeTab = 'logs'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Logs
        </button>
        <button
          on:click={() => activeTab = 'settings'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Settings
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'overview'}
      <!-- Overview Dashboard -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- System Status -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">System Status</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(systemStatus.backend)}">
                      {systemStatus.backend}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Quizzes -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Quizzes</dt>
                  <dd class="text-lg font-medium text-gray-900">{systemStatus.activeQuizzes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Participants -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Participants</dt>
                  <dd class="text-lg font-medium text-gray-900">{systemStatus.participants}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Database Status -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Database</dt>
                  <dd class="text-lg font-medium text-gray-900">
                    <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(systemStatus.database)}">
                      {systemStatus.database}
                    </span>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            on:click={() => activeTab = 'quizzes'}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Quiz
          </button>
          <button
            on:click={createBackup}
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Create Backup
          </button>
          <button
            on:click={restartServices}
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart Services
          </button>
        </div>
      </div>

    {:else if activeTab === 'quizzes'}
      <!-- Quizzes Management -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Quiz Management</h3>
          
          {#if isLoading}
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading quizzes...</p>
            </div>
          {:else if quizzes.length === 0}
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
              <p class="mt-1 text-sm text-gray-500">Get started by creating a new quiz.</p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each quizzes as quiz}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div class="text-sm font-medium text-gray-900">{quiz.title}</div>
                          <div class="text-sm text-gray-500">{quiz.gameId}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full {quiz.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                          {quiz.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {quiz._count?.participants || 0}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(quiz.createdAt)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {#if quiz.isActive}
                          <button
                            on:click={() => stopQuiz(quiz.gameId)}
                            class="text-red-600 hover:text-red-900"
                          >
                            Stop
                          </button>
                        {:else}
                          <button
                            on:click={() => startQuiz(quiz.gameId)}
                            class="text-green-600 hover:text-green-900"
                          >
                            Start
                          </button>
                        {/if}
                        <button
                          on:click={() => exportQuizData(quiz.gameId, 'participants')}
                          class="text-blue-600 hover:text-blue-900"
                        >
                          Export
                        </button>
                        <button
                          on:click={() => deleteQuiz(quiz.gameId)}
                          class="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'participants'}
      <!-- Participants Management -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Participants</h3>
          
          {#if participants.length === 0}
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No participants</h3>
              <p class="mt-1 text-sm text-gray-500">Participants will appear here when they join quizzes.</p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each participants as participant}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.nickname}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {LanguageManager.getLanguageName(participant.language)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.quiz?.title || 'Unknown'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 text-xs font-medium rounded-full {participant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                          {participant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(participant.joinedAt)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'exports'}
      <!-- Exports Management -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Exports</h3>
          
          {#if exports.length === 0}
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No exports</h3>
              <p class="mt-1 text-sm text-gray-500">Exports will appear here when you download quiz data.</p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each exports as exportItem}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exportItem.filename}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exportItem.type}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exportItem.quiz?.title || 'Unknown'}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(exportItem.createdAt)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'logs'}
      <!-- System Logs -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Recent System Logs</h3>
          
          {#if logs.length === 0}
            <div class="text-center py-8">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No logs</h3>
              <p class="mt-1 text-sm text-gray-500">System logs will appear here.</p>
            </div>
          {:else}
            <div class="bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-96">
              <pre class="text-green-400 text-sm">
                {#each logs as log}
                  <div>{log}</div>
                {/each}
              </pre>
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'settings'}
      <!-- System Settings -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">System Settings</h3>
          
          <form on:submit|preventDefault={updateSettings} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700">Maximum Participants per Quiz</label>
                <input
                  bind:value={settings.maxParticipants}
                  type="number"
                  min="1"
                  max="1000"
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Default Language</label>
                <select
                  bind:value={settings.defaultLanguage}
                  class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {#each LanguageManager.getSupportedLanguages() as lang}
                    <option value={lang.code}>{lang.flag} {lang.name}</option>
                  {/each}
                </select>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-center">
                <input
                  bind:checked={settings.autoBackup}
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">Enable automatic backups</label>
              </div>
              
              <div class="flex items-center">
                <input
                  bind:checked={settings.emailNotifications}
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">Enable email notifications</label>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button
                type="submit"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
  </main>
</div>
