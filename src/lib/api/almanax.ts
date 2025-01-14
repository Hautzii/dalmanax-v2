import type { AlmanaxState } from '../types/AlmanaxState';
import { sourceLanguageTag, languageTag } from '$lib/paraglide/runtime';

const BASE_URL = 'https://api.dofusdu.de/dofus2';
const getURL = (path: string) => `${BASE_URL}/${languageTag() || sourceLanguageTag}${path}`;

const createAlmanaxState = (data: any): AlmanaxState => ({
    bonus: data.bonus.type.name,
    bonus_id: data.bonus.type.id,
    description: data.bonus.description,
    date: new Date(data.date).toISOString().split('T')[0],
    image: data.tribute.item.image_urls.hd,
    loot: data.tribute.item.name,
    quantity: data.tribute.quantity,
    reward_kamas: data.reward_kamas,
    subtype: data.subtype,
    loot_id: data.tribute.item.ankama_id
});

export const fetchAlmanaxData = () =>
    fetch(getURL('/almanax?range%5Bsize%5D=8'))
        .then(res => res.json())
        .then(data => data.map(createAlmanaxState));