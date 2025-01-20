import { persisted } from 'svelte-persisted-store';
import { browser } from '$app/environment';
import type { Preferences } from '$lib/types/Preferences';

const defaultPreferences: Preferences = {
  language: 'fr',
  level: 150,
  isAccountProtected: true
};

if (browser) {
  const storedLevel = localStorage.getItem('level');
  const storedLanguage = localStorage.getItem('language');
  const storedIsAccountProtected = localStorage.getItem('isAccountProtected');
  
  if (storedLanguage) defaultPreferences.language = storedLanguage;
  if (storedLevel) {
    const parsedLevel = parseInt(storedLevel, 10);
    if (!isNaN(parsedLevel)) defaultPreferences.level = parsedLevel;
  }
  if (storedIsAccountProtected) {
    const parsedIsAccountProtected = JSON.parse(storedIsAccountProtected);
    if (!isNaN(parsedIsAccountProtected)) defaultPreferences.isAccountProtected = parsedIsAccountProtected;
  }
}

export const preferences = persisted<Preferences>('preferences', defaultPreferences);