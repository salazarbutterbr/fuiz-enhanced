import { writable } from 'svelte/store';

// Create a store for dark mode state
export const darkMode = writable(false);

// Initialize dark mode from localStorage or system preference
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    darkMode.set(saved === 'true');
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode.set(prefersDark);
  }
  
  // Subscribe to changes and save to localStorage
  darkMode.subscribe(value => {
    localStorage.setItem('darkMode', value.toString());
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
}

// Toggle dark mode
export function toggleDarkMode() {
  darkMode.update(value => !value);
}
