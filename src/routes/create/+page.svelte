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

<div class="min-h-screen bg-black">
	<!-- Header -->
	<header class="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-white">Fuiz</h1>
				</div>
				<div class="flex items-center space-x-4">
					<a href="/host" class="text-white/80 hover:text-white transition-colors">
						Host
					</a>
					<a href="/play" class="text-white/80 hover:text-white transition-colors">
						Play
					</a>
					<a href="/" class="text-white/80 hover:text-white transition-colors">
						Home
					</a>
				</div>
			</div>
		</div>
	</header>

	<main class="max-w-4xl mx-auto px-4 py-8">
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-white mb-2">Create Quiz</h1>
			<p class="text-white/60">Build engaging quizzes with multiple question types</p>
		</div>

		{#if errorMessage}
			<div class="mb-6 bg-red-900/20 border border-red-500/20 rounded-xl p-4">
				<p class="text-red-400">{errorMessage}</p>
			</div>
		{/if}

		{#if successMessage}
			<div class="mb-6 bg-green-900/20 border border-green-500/20 rounded-xl p-4">
				<p class="text-green-400">{successMessage}</p>
			</div>
		{/if}

		<!-- Tabs -->
		<div class="mb-8">
			<div class="flex space-x-1 bg-gray-900/50 rounded-xl p-1">
				<button
					on:click={() => activeTab = 'basic'}
					class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab === 'basic' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}"
				>
					Basic Info
				</button>
				<button
					on:click={() => activeTab = 'slides'}
					class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab === 'slides' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}"
				>
					Questions ({slides.length})
				</button>
				<button
					on:click={() => activeTab = 'preview'}
					class="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors {activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'}"
				>
					Preview
				</button>
			</div>
		</div>

		{#if activeTab === 'basic'}
			<!-- Basic Information -->
			<div class="space-y-6">
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
					<h2 class="text-xl font-semibold text-white mb-4">Quiz Information</h2>
					
					<div class="space-y-4">
						<div>
							<label for="quizTitle" class="block text-sm font-medium text-white/80 mb-2">
								Quiz Title *
							</label>
							<input
								id="quizTitle"
								type="text"
								bind:value={quizTitle}
								placeholder="Enter quiz title..."
								class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
								required
							/>
						</div>

						<div>
							<label for="quizDescription" class="block text-sm font-medium text-white/80 mb-2">
								Description
							</label>
							<textarea
								id="quizDescription"
								bind:value={quizDescription}
								placeholder="Enter quiz description..."
								rows="3"
								class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
							></textarea>
						</div>

						<div>
							<label for="primaryLanguage" class="block text-sm font-medium text-white/80 mb-2">
								Primary Language
							</label>
							<select
								id="primaryLanguage"
								bind:value={primaryLanguage}
								class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
							>
								{#each LanguageManager.getSupportedLanguages() as language}
									<option value={language.code}>
										{language.flag} {language.name}
									</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="maxParticipants" class="block text-sm font-medium text-white/80 mb-2">
								Maximum Participants per Quiz
							</label>
							<input
								id="maxParticipants"
								type="number"
								bind:value={maxParticipants}
								min="1"
								max="1000"
								class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
							/>
						</div>
					</div>
				</div>

				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
					<h2 class="text-xl font-semibold text-white mb-4">Available Languages</h2>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						{#each LanguageManager.getSupportedLanguages() as language}
							<label class="flex items-center space-x-2 cursor-pointer">
								<input
									type="checkbox"
									checked={selectedLanguages.includes(language.code)}
									on:change={() => toggleLanguage(language.code)}
									class="rounded border-white/20 bg-black/50 text-blue-600 focus:ring-blue-500"
								/>
								<span class="text-white/80">{language.flag} {language.name}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
					<h2 class="text-xl font-semibold text-white mb-4">Upload Quiz File (Optional)</h2>
					<div class="space-y-4">
						<div>
							<label for="fileUpload" class="block text-sm font-medium text-white/80 mb-2">
								Upload Quiz File
							</label>
							<input
								id="fileUpload"
								type="file"
								accept=".json,.csv"
								on:change={handleFileUpload}
								class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
							/>
						</div>

						{#if isUploading}
							<div class="w-full bg-gray-800 rounded-full h-2">
								<div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: {uploadProgress}%"></div>
							</div>
						{/if}

						<div class="flex space-x-2">
							<button
								type="button"
								on:click={downloadTemplate}
								class="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors border border-white/20"
							>
								Download Template
							</button>
						</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'slides'}
			<!-- Questions/Slides -->
			<div class="space-y-6">
				<!-- Add Question Buttons -->
				<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
					<h2 class="text-xl font-semibold text-white mb-4">Questions</h2>
					<div class="flex flex-wrap gap-3">
						<button
							on:click={() => addSlide('multiple_choice')}
							class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Multiple Choice
						</button>
						<button
							on:click={() => addSlide('type_answer')}
							class="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/20"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Type Answer
						</button>
						<button
							on:click={() => addSlide('order')}
							class="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/20"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
							Add Order Question
						</button>
					</div>
				</div>

				<!-- Question List -->
				{#if slides.length === 0}
					<div class="text-center py-12">
						<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
							<h3 class="text-xl font-semibold text-white mb-4">No questions yet</h3>
							<p class="text-white/60 mb-6">Add your first question to get started!</p>
							<button
								on:click={() => addSlide('multiple_choice')}
								class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
							>
								Add First Question
							</button>
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#each slides as slide, index}
							<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
								<div class="flex justify-between items-start mb-4">
									<h3 class="text-lg font-semibold text-white">Question {index + 1}</h3>
									<button
										on:click={() => slides = slides.filter((_, i) => i !== index)}
										class="text-red-400 hover:text-red-300 transition-colors"
										aria-label="Remove question"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>

								<div class="space-y-4">
									<div>
										<label for="slideTitle{index}" class="block text-sm font-medium text-white/80 mb-2">
											Question Title
										</label>
										<input
											id="slideTitle{index}"
											type="text"
											bind:value={slide.title}
											placeholder="Enter question title..."
											class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
										/>
									</div>

									{#if slide.type === 'multiple_choice'}
										<div>
											<label for="slideQuestion{index}" class="block text-sm font-medium text-white/80 mb-2">
												Question Text
											</label>
											<input
												id="slideQuestion{index}"
												type="text"
												bind:value={slide.content.question}
												placeholder="Enter question text..."
												class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-white/80 mb-2">
												Correct Answers
											</label>
											<div class="space-y-2">
												{#each slide.content.answers as answer, answerIndex}
													<div class="flex items-center space-x-2">
														<input
															type="radio"
															name="correct{index}"
															checked={answer.correct}
															on:change={() => {
																slide.content.answers.forEach((a, i) => a.correct = i === answerIndex);
																slides = [...slides];
															}}
															class="text-blue-600 focus:ring-blue-500"
														/>
														<input
															type="text"
															bind:value={answer.content.Text}
															placeholder="Answer option {answerIndex + 1}..."
															class="flex-1 px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
														/>
													</div>
												{/each}
											</div>
										</div>
									{:else if slide.type === 'type_answer'}
										<div>
											<label for="slideQuestion{index}" class="block text-sm font-medium text-white/80 mb-2">
												Question Text
											</label>
											<input
												id="slideQuestion{index}"
												type="text"
												bind:value={slide.content.question}
												placeholder="Enter question text..."
												class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
											/>
										</div>

										<div>
											<label class="block text-sm font-medium text-white/80 mb-2">
												Correct Answers (one per line)
											</label>
											<textarea
												value={slide.content.answers.join('\n')}
												on:input={(e) => {
													slide.content.answers = e.target.value.split('\n').filter(a => a.trim());
													slides = [...slides];
												}}
												placeholder="Enter correct answers..."
												rows="3"
												class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40"
											></textarea>
										</div>
									{/if}

									<div class="grid grid-cols-2 gap-4">
										<div>
											<label for="timeLimit{index}" class="block text-sm font-medium text-white/80 mb-2">
												Time Limit (seconds)
											</label>
											<input
												id="timeLimit{index}"
												type="number"
												bind:value={slide.timeLimit}
												min="5"
												max="300"
												class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
											/>
										</div>
										<div>
											<label for="points{index}" class="block text-sm font-medium text-white/80 mb-2">
												Points
											</label>
											<input
												id="points{index}"
												type="number"
												bind:value={slide.points}
												min="1"
												max="100"
												class="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
											/>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if activeTab === 'preview'}
			<!-- Preview -->
			<div class="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
				<h2 class="text-xl font-semibold text-white mb-4">Quiz Preview</h2>
				
				{#if quizTitle}
					<div class="mb-6">
						<h3 class="text-2xl font-bold text-white mb-2">{quizTitle}</h3>
						{#if quizDescription}
							<p class="text-white/60">{quizDescription}</p>
						{/if}
					</div>
				{/if}

				{#if slides.length > 0}
					<div class="space-y-4">
						{#each slides as slide, index}
							<div class="bg-black/50 rounded-xl p-4 border border-white/10">
								<h4 class="text-lg font-semibold text-white mb-2">Question {index + 1}: {slide.title}</h4>
								{#if slide.content.question}
									<p class="text-white/80 mb-3">{slide.content.question}</p>
								{/if}
								
								{#if slide.type === 'multiple_choice'}
									<div class="space-y-2">
										{#each slide.content.answers as answer}
											<div class="flex items-center space-x-2">
												<div class="w-4 h-4 rounded-full border-2 border-white/20"></div>
												<span class="text-white/60">{answer.content.Text}</span>
												{#if answer.correct}
													<span class="text-green-400 text-sm">✓</span>
												{/if}
											</div>
										{/each}
									</div>
								{:else if slide.type === 'type_answer'}
									<div class="space-y-1">
										{#each slide.content.answers as answer}
											<div class="text-white/60">• {answer}</div>
										{/each}
									</div>
								{/if}
								
								<div class="mt-3 text-sm text-white/40">
									Time: {slide.timeLimit}s • Points: {slide.points}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-white/60">No questions added yet.</p>
				{/if}
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex justify-between items-center pt-8">
			<button
				on:click={() => activeTab = activeTab === 'basic' ? 'basic' : activeTab === 'slides' ? 'basic' : 'slides'}
				class="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors border border-white/20"
			>
				{activeTab === 'basic' ? 'Cancel' : 'Back'}
			</button>
			
			<div class="flex space-x-3">
				{#if activeTab === 'basic'}
					<button
						on:click={() => activeTab = 'slides'}
						class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
					>
						Next: Add Questions
					</button>
				{:else if activeTab === 'slides'}
					<button
						on:click={() => activeTab = 'preview'}
						class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
					>
						Preview Quiz
					</button>
				{:else if activeTab === 'preview'}
					<button
						on:click={createQuiz}
						disabled={!quizTitle.trim() || slides.length === 0}
						class="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Create Quiz
					</button>
				{/if}
			</div>
		</div>
	</main>
</div> 