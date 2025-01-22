import { fetchAlmanaxData } from '$lib/api/almanax';
import { get } from 'svelte/store';
import { preferences } from '$lib/stores/almanaxStore';
import { initAnalytics } from '$lib/analytics';
import { browser } from '$app/environment';

export async function load() {
  if (browser) {
    initAnalytics();
  }
  const { level, language } = get(preferences);
  return { items: await fetchAlmanaxData(level, language) };
}