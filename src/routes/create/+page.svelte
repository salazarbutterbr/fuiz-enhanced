<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { LanguageManager } from '$lib/utils/languageManager.js';
  import { TranslationManager } from '$lib/utils/translationManager.js';
  import type { AvailableLanguageTag, IdlessSlide, IdlessFuizConfig } from '$lib/types';

  // Quiz configuration
  let quizTitle = '';
  let quizDescription = '';
  let primaryLanguage: AvailableLanguageTag = 'en';
  let selectedLanguages: AvailableLanguageTag[] = ['en'];
  let maxParticipants = 500;
  
  // Slides
  let slides: IdlessSlide[] = [];
  let currentSlideIndex = -1;
  
  // File upload
  let uploadedFile: File | null = null;
  let uploadProgress = 0;
  let isUploading = false;
  
  // UI state
  let activeTab = 'basic';
  let showPreview = false;
  let errorMessage = '';
  let successMessage = '';

  onMount(() => {
    // Set default language based on browser
    primaryLanguage = LanguageManager.getBrowserLanguage();
    selectedLanguages = [primaryLanguage];
  });

  function addSlide(type: 'multiple_choice' | 'type_answer' | 'order') {
    const newSlide: IdlessSlide = {
      type,
      title: `Question ${slides.length + 1}`,
      content: type === 'multiple_choice' ? {
        question: '',
        answers: [
          { content: { Text: '' }, correct: true },
          { content: { Text: '' }, correct: false },
          { content: { Text: '' }, correct: false },
          { content: { Text: '' }, correct: false }
        ]
      } : type === 'type_answer' ? {
        question: '',
        answers: ['']
      } : {
        question: '',
        answers: []
      },
      timeLimit: 30,
      points: 10,
      order: slides.length,
      translations: {}
    };
    
    slides = [...slides, newSlide];
    currentSlideIndex = slides.length - 1;
  }

  function removeSlide(index: number) {
    slides = slides.filter((_, i) => i !== index);
    slides.forEach((slide, i) => {
      slide.order = i;
    });
    if (currentSlideIndex >= slides.length) {
      currentSlideIndex = slides.length - 1;
    }
  }

  function updateSlide(index: number, updates: Partial<IdlessSlide>) {
    slides[index] = { ...slides[index], ...updates };
    slides = [...slides];
  }

  function addTranslation(slideIndex: number, language: AvailableLanguageTag) {
    if (!slides[slideIndex].translations) {
      slides[slideIndex].translations = {};
    }
    slides[slideIndex].translations[language] = {
      title: slides[slideIndex].title,
      content: slides[slideIndex].content
    };
    slides = [...slides];
  }

  function removeTranslation(slideIndex: number, language: AvailableLanguageTag) {
    if (slides[slideIndex].translations && slides[slideIndex].translations[language]) {
      delete slides[slideIndex].translations[language];
      slides = [...slides];
    }
  }

  async function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    uploadedFile = file;
    isUploading = true;
    uploadProgress = 0;
    errorMessage = '';
    
    try {
      const content = await readFileContent(file);
      const quizData = parseQuizFile(content, file.name);
      
      // Apply uploaded data
      quizTitle = quizData.title || quizTitle;
      quizDescription = quizData.description || quizDescription;
      primaryLanguage = quizData.primaryLanguage || primaryLanguage;
      selectedLanguages = quizData.availableLanguages || selectedLanguages;
      maxParticipants = quizData.maxParticipants || maxParticipants;
      slides = quizData.slides || slides;
      
      successMessage = `Quiz "${quizData.title}" uploaded successfully with ${quizData.slides?.length || 0} questions!`;
      
      // Auto-switch to slides tab
      activeTab = 'slides';
      
    } catch (error) {
      errorMessage = `Upload failed: ${error.message}`;
    } finally {
      isUploading = false;
      uploadProgress = 100;
    }
  }

  function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  function parseQuizFile(content: string, filename: string): IdlessFuizConfig {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (extension === 'json') {
      try {
        const data = JSON.parse(content);
        return validateQuizData(data);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    } else if (extension === 'csv') {
      return parseCSVQuiz(content);
    } else {
      throw new Error('Unsupported file format. Please use JSON or CSV.');
    }
  }

  function validateQuizData(data: any): IdlessFuizConfig {
    // Basic validation
    if (!data.title) throw new Error('Quiz title is required');
    if (!data.slides || !Array.isArray(data.slides)) {
      throw new Error('Quiz must contain slides array');
    }
    
    return {
      title: data.title,
      description: data.description || '',
      primaryLanguage: data.primaryLanguage || 'en',
      availableLanguages: data.availableLanguages || ['en'],
      maxParticipants: data.maxParticipants || 500,
      slides: data.slides.map((slide: any, index: number) => ({
        type: slide.type || 'multiple_choice',
        title: slide.title || `Question ${index + 1}`,
        content: slide.content || {},
        timeLimit: slide.timeLimit || 30,
        points: slide.points || 10,
        order: index,
        translations: slide.translations || {}
      }))
    };
  }

  function parseCSVQuiz(content: string): IdlessFuizConfig {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must contain at least header and one question');
    
    const headers = lines[0].split(',').map(h => h.trim());
    const slides: IdlessSlide[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const slide: IdlessSlide = {
        type: 'multiple_choice',
        title: values[0] || `Question ${i}`,
        content: {
          question: values[1] || '',
          answers: [
            { content: { Text: values[2] || '' }, correct: values[2] === values[6] },
            { content: { Text: values[3] || '' }, correct: values[3] === values[6] },
            { content: { Text: values[4] || '' }, correct: values[4] === values[6] },
            { content: { Text: values[5] || '' }, correct: values[5] === values[6] }
          ]
        },
        timeLimit: parseInt(values[7]) || 30,
        points: parseInt(values[8]) || 10,
        order: i - 1,
        translations: {}
      };
      slides.push(slide);
    }
    
    return {
      title: 'Imported Quiz',
      description: 'Quiz imported from CSV file',
      primaryLanguage: 'en',
      availableLanguages: ['en'],
      maxParticipants: 500,
      slides
    };
  }

  function exportQuiz() {
    const quizData: IdlessFuizConfig = {
      title: quizTitle,
      description: quizDescription,
      primaryLanguage,
      availableLanguages: selectedLanguages,
      maxParticipants,
      slides
    };
    
    const blob = new Blob([JSON.stringify(quizData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizTitle.replace(/[^a-z0-9]/gi, '_')}_quiz.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const template = {
      title: "Sample Quiz",
      description: "A sample quiz with multiple choice questions",
      primaryLanguage: "en",
      availableLanguages: ["en", "es", "fr"],
      maxParticipants: 500,
      slides: [
        {
          type: "multiple_choice",
          title: "What is the capital of France?",
          content: {
            question: "Select the correct answer:",
            answers: [
              { content: { Text: "London" }, correct: false },
              { content: { Text: "Paris" }, correct: true },
              { content: { Text: "Berlin" }, correct: false },
              { content: { Text: "Madrid" }, correct: false }
            ]
          },
          timeLimit: 30,
          points: 10,
          order: 0,
          translations: {
            es: {
              title: "¿Cuál es la capital de Francia?",
              content: {
                question: "Selecciona la respuesta correcta:",
                answers: [
                  { content: { Text: "Londres" }, correct: false },
                  { content: { Text: "París" }, correct: true },
                  { content: { Text: "Berlín" }, correct: false },
                  { content: { Text: "Madrid" }, correct: false }
                ]
              }
            }
          }
        }
      ]
    };
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function createQuiz() {
    if (!quizTitle.trim()) {
      errorMessage = 'Quiz title is required';
      return;
    }
    
    if (slides.length === 0) {
      errorMessage = 'At least one question is required';
      return;
    }
    
    try {
      const quizData: IdlessFuizConfig = {
        title: quizTitle,
        description: quizDescription,
        primaryLanguage,
        availableLanguages: selectedLanguages,
        maxParticipants,
        slides
      };
      
      // Here you would send to your backend API
      const response = await fetch('/api/quiz/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizData)
      });
      
      if (response.ok) {
        const result = await response.json();
        successMessage = `Quiz "${quizTitle}" created successfully! Game ID: ${result.quiz.gameId}`;
        
        // Redirect to host dashboard
        setTimeout(() => {
          goto(`/host/${result.quiz.gameId}`);
        }, 2000);
      } else {
        throw new Error('Failed to create quiz');
      }
    } catch (error) {
      errorMessage = `Failed to create quiz: ${error.message}`;
    }
  }

  function toggleLanguage(language: AvailableLanguageTag) {
    if (selectedLanguages.includes(language)) {
      selectedLanguages = selectedLanguages.filter(l => l !== language);
    } else {
      selectedLanguages = [...selectedLanguages, language];
    }
  }
</script>

<svelte:head>
  <title>Create Quiz - Fuiz Enhanced</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Create New Quiz</h1>
      <p class="mt-2 text-gray-600">Build a multi-language quiz with custom questions and translations</p>
    </div>

    <!-- Messages -->
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

    {#if successMessage}
      <div class="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM5 9a1 1 0 011-1h1.6a1 1 0 01.7.3l3.38 3.45a1 1 0 001.13.188l1.22-.61a1 1 0 01.64 1.264l-.39 1.24a1 1 0 01-.16.55l-.54.54a1 1 0 01-.7.29H9a1 1 0 01-1-1v-1.6a1 1 0 01.3-.7l3.45-3.38a1 1 0 00.188-1.13l-.61-1.22a1 1 0 011.264-.64l1.24.39a1 1 0 01.55.16l.54.54a1 1 0 01.29.7V9a1 1 0 01-1 1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8">
        <button
          on:click={() => activeTab = 'basic'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Basic Info
        </button>
        <button
          on:click={() => activeTab = 'upload'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Upload Quiz
        </button>
        <button
          on:click={() => activeTab = 'slides'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'slides' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Questions ({slides.length})
        </button>
        <button
          on:click={() => activeTab = 'preview'}
          class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'preview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          Preview
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    {#if activeTab === 'basic'}
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Quiz Information</h2>
        
        <div class="space-y-6">
          <!-- Title and Description -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Quiz Title *</label>
            <input
              id="title"
              bind:value={quizTitle}
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              bind:value={quizDescription}
              rows={3}
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter quiz description"
            ></textarea>
          </div>
          
          <!-- Primary Language -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Primary Language</label>
            <select
              bind:value={primaryLanguage}
              class="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {#each LanguageManager.getSupportedLanguages() as lang}
                <option value={lang.code}>{lang.flag} {lang.name}</option>
              {/each}
            </select>
          </div>
          
          <!-- Available Languages -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Available Languages</label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              {#each LanguageManager.getSupportedLanguages() as lang}
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.code)}
                    on:change={() => toggleLanguage(lang.code)}
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-2 text-sm text-gray-700">{lang.flag} {lang.name}</span>
                </label>
              {/each}
            </div>
          </div>
          
          <!-- Max Participants -->
          <div>
            <label for="maxParticipants" class="block text-sm font-medium text-gray-700">Maximum Participants</label>
            <input
              id="maxParticipants"
              bind:value={maxParticipants}
              type="number"
              min="1"
              max="1000"
              class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    {:else if activeTab === 'upload'}
      <!-- Upload Quiz -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Upload Quiz File</h2>
        
        <div class="space-y-6">
          <!-- File Upload -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Upload Quiz File</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".json,.csv"
                on:change={handleFileUpload}
                class="hidden"
                id="file-upload"
              />
              <label for="file-upload" class="cursor-pointer">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                  <span class="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                </p>
                <p class="mt-1 text-xs text-gray-500">JSON or CSV files only</p>
              </label>
            </div>
          </div>
          
          <!-- Upload Progress -->
          {#if isUploading}
            <div>
              <div class="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: {uploadProgress}%"></div>
              </div>
            </div>
          {/if}
          
          <!-- Template Download -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 mb-2">Need a template?</h3>
            <p class="text-sm text-gray-600 mb-3">Download our quiz template to see the correct format for JSON files.</p>
            <button
              on:click={downloadTemplate}
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </button>
          </div>
          
          <!-- File Format Help -->
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900 mb-2">Supported Formats</h3>
            <div class="text-sm text-blue-800 space-y-1">
              <p><strong>JSON:</strong> Complete quiz structure with translations</p>
              <p><strong>CSV:</strong> Simple question-answer format</p>
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === 'slides'}
      <!-- Questions/Slides -->
      <div class="space-y-6">
        <!-- Add Question Buttons -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Questions</h2>
          <div class="flex flex-wrap gap-3">
            <button
              on:click={() => addSlide('multiple_choice')}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Multiple Choice
            </button>
            <button
              on:click={() => addSlide('type_answer')}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Type Answer
            </button>
            <button
              on:click={() => addSlide('order')}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Order Question
            </button>
          </div>
        </div>

        <!-- Question List -->
        {#if slides.length > 0}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Question List Sidebar -->
            <div class="lg:col-span-1">
              <div class="bg-white rounded-lg shadow p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Question List</h3>
                <div class="space-y-2">
                  {#each slides as slide, index}
                    <div
                      on:click={() => currentSlideIndex = index}
                      class="w-full text-left p-3 rounded-lg border cursor-pointer {currentSlideIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}"
                    >
                      <div class="flex justify-between items-center">
                        <span class="font-medium text-gray-900">Q{index + 1}</span>
                        <button
                          on:click|stopPropagation={() => removeSlide(index)}
                          class="text-red-600 hover:text-red-800"
                        >
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p class="text-sm text-gray-600 truncate">{slide.title}</p>
                      <span class="text-xs text-gray-500">{slide.type}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

            <!-- Question Editor -->
            {#if currentSlideIndex >= 0}
              <div class="lg:col-span-2">
                <div class="bg-white rounded-lg shadow p-6">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">
                    Question {currentSlideIndex + 1} - {slides[currentSlideIndex].type}
                  </h3>
                  
                  <!-- Question Title -->
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">Question Title</label>
                    <input
                      bind:value={slides[currentSlideIndex].title}
                      type="text"
                      class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <!-- Question Content -->
                  {#if slides[currentSlideIndex].type === 'multiple_choice'}
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Question Text</label>
                        <input
                          bind:value={slides[currentSlideIndex].content.question}
                          type="text"
                          class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Answer Options</label>
                        {#each slides[currentSlideIndex].content.answers as answer, answerIndex}
                          <div class="flex items-center mt-2">
                            <input
                              type="radio"
                              name="correct-{currentSlideIndex}"
                              checked={answer.correct}
                              on:change={() => {
                                slides[currentSlideIndex].content.answers.forEach((a, i) => a.correct = i === answerIndex);
                                slides = [...slides];
                              }}
                              class="mr-3"
                            />
                            <input
                              bind:value={answer.content.Text}
                              type="text"
                              class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Answer option"
                            />
                          </div>
                        {/each}
                      </div>
                    </div>
                  {:else if slides[currentSlideIndex].type === 'type_answer'}
                    <div class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Question Text</label>
                        <input
                          bind:value={slides[currentSlideIndex].content.question}
                          type="text"
                          class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Correct Answers (one per line)</label>
                        <textarea
                          bind:value={slides[currentSlideIndex].content.answers.join('\n')}
                          rows={3}
                          class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter correct answers"
                        ></textarea>
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Question Settings -->
                  <div class="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Time Limit (seconds)</label>
                      <input
                        bind:value={slides[currentSlideIndex].timeLimit}
                        type="number"
                        min="5"
                        max="300"
                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Points</label>
                      <input
                        bind:value={slides[currentSlideIndex].points}
                        type="number"
                        min="1"
                        max="100"
                        class="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <!-- Translation Management -->
                  <div class="mt-6">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Translations</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {#each selectedLanguages as lang}
                        {#if lang !== primaryLanguage}
                          <button
                            on:click={() => {
                              if (slides[currentSlideIndex].translations?.[lang]) {
                                removeTranslation(currentSlideIndex, lang);
                              } else {
                                addTranslation(currentSlideIndex, lang);
                              }
                            }}
                            class="px-3 py-2 text-sm rounded-md border {slides[currentSlideIndex].translations?.[lang] ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
                          >
                            {LanguageManager.getLanguageName(lang)}
                          </button>
                        {/if}
                      {/each}
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-white rounded-lg shadow p-12 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by adding your first question.</p>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'preview'}
      <!-- Preview -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Quiz Preview</h2>
        
        <div class="space-y-6">
          <!-- Quiz Info -->
          <div class="border-b pb-4">
            <h3 class="text-lg font-medium text-gray-900">{quizTitle || 'Untitled Quiz'}</h3>
            {#if quizDescription}
              <p class="text-gray-600 mt-1">{quizDescription}</p>
            {/if}
            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Primary: {LanguageManager.getLanguageName(primaryLanguage)}</span>
              <span>Languages: {selectedLanguages.length}</span>
              <span>Questions: {slides.length}</span>
              <span>Max Participants: {maxParticipants}</span>
            </div>
          </div>
          
          <!-- Questions Preview -->
          {#if slides.length > 0}
            <div class="space-y-4">
              {#each slides as slide, index}
                <div class="border rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-900">Q{index + 1}: {slide.title}</h4>
                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{slide.type}</span>
                  </div>
                  {#if slide.content.question}
                    <p class="text-gray-600 text-sm mb-2">{slide.content.question}</p>
                  {/if}
                  <div class="flex justify-between text-xs text-gray-500">
                    <span>{slide.timeLimit}s</span>
                    <span>{slide.points} points</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-gray-500 text-center py-8">No questions to preview</p>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="mt-8 flex justify-between items-center">
      <div class="flex space-x-3">
        <button
          on:click={() => exportQuiz()}
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Quiz
        </button>
      </div>
      
      <button
        on:click={createQuiz}
        disabled={!quizTitle.trim() || slides.length === 0}
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create Quiz
      </button>
    </div>
  </div>
</div> 