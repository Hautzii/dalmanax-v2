import { fetchAlmanaxData } from '$lib/api/almanax';

export async function load() {
    const items = await fetchAlmanaxData();
    return { items };
}
