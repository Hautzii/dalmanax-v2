import type { AlmanaxState } from '$lib/types/AlmanaxState';
import type { Dofus3Data } from '$lib/types/AlmanaxDataType';
import { sourceLanguageTag, languageTag } from '$lib/paraglide/runtime';

const BASE_URL_DOFUS3 = 'https://api.dofusdu.de/dofus3/v1';
const BASE_URL_DOFUS2 = 'https://api.dofusdu.de/dofus2';
const RANGE_QUERY = 'range%5Bsize%5D=7';

const getDofus3URL = (path: string) => `${BASE_URL_DOFUS3}/${languageTag() || sourceLanguageTag}${path}`;
const getDofus2URL = (path: string) => `${BASE_URL_DOFUS2}/${languageTag() || sourceLanguageTag}${path}`;

const fetchDofus2Image = async (itemName: string, ankamaId: number): Promise<string | null> => {
    try {
        const response = await fetch(
            getDofus2URL(`/items/search?query=${encodeURIComponent(itemName)}&limit=1`)
        );
        if (!response.ok) return null;

        const data = await response.json();
        if (data.length > 0 && data[0].ankama_id === ankamaId && data[0].image_urls?.hd) {
            return data[0].image_urls.hd;
        }
        return null;
    } catch (error) {
        return null;
    }
};

const createAlmanaxState = async (dofus3Data: Dofus3Data): Promise<AlmanaxState> => {
    const dofus2Image = await fetchDofus2Image(dofus3Data.tribute.item.name, dofus3Data.tribute.item.ankama_id);
    const image = dofus2Image || dofus3Data.tribute.item.image_urls.hd || dofus3Data.tribute.item.image_urls.sd;

    return {
        bonus: dofus3Data.bonus.type.name,
        bonus_id: dofus3Data.bonus.type.id,
        description: dofus3Data.bonus.description,
        date: new Date(dofus3Data.date).toISOString().split('T')[0],
        image,
        loot: dofus3Data.tribute.item.name,
        quantity: dofus3Data.tribute.quantity,
        reward_kamas: dofus3Data.reward_kamas,
        reward_xp: dofus3Data.reward_xp,
        subtype: dofus3Data.tribute.item.subtype,
        loot_id: dofus3Data.tribute.item.ankama_id
    };
};

export const fetchAlmanaxData = async (level: number): Promise<AlmanaxState[]> => {
    const dofus3Data = await fetch(getDofus3URL(`/almanax?${RANGE_QUERY}&level=${level}`))
        .then(res => res.json());

    return Promise.all(dofus3Data.map((d3Item: Dofus3Data) => createAlmanaxState(d3Item)));
};