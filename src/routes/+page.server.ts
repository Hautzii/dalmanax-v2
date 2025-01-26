import { fetchAlmanaxData } from '$lib/api/almanax';
import { get } from 'svelte/store';
import { preferences } from '$lib/stores/almanaxStore';

export async function load() {
  const { level } = get(preferences);
  return { items: await fetchAlmanaxData(level) };
}