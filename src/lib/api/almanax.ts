import type { AlmanaxState } from '../types/AlmanaxState';
import { sourceLanguageTag, languageTag } from '$lib/paraglide/runtime';
import { almanaxItems } from '$lib/stores/almanaxStore';

const BASE_URL = 'https://api.dofusdu.de/dofus3/v1';
const BASE_URL_DOFUS2 = 'https://api.dofusdu.de/dofus2';

const getURL = (path: string) => `${BASE_URL}/${languageTag() || sourceLanguageTag}${path}`;
const getDofus2URL = (path: string) => `${BASE_URL_DOFUS2}/${languageTag() || sourceLanguageTag}${path}`;

const createAlmanaxState = (dofus3Data: any, dofus2Data: any): AlmanaxState => ({
    bonus: dofus3Data.bonus.type.name,
    bonus_id: dofus3Data.bonus.type.id,
    description: dofus3Data.bonus.description,
    date: new Date(dofus3Data.date).toISOString().split('T')[0],
    image: (dofus2Data?.tribute?.item?.image_urls?.hd) || 
        dofus3Data.tribute.item.image_urls.sd ||
        dofus3Data.tribute.item.image_urls.hd,
    loot: dofus3Data.tribute.item.name,
    quantity: dofus3Data.tribute.quantity,
    reward_kamas: dofus3Data.reward_kamas,
    reward_xp: dofus3Data.reward_xp,
    subtype: dofus3Data.subtype,
    loot_id: dofus3Data.tribute.item.ankama_id
});

export const fetchAlmanaxData = (level: number = 200) => 
    Promise.all([
        fetch(getURL(`/almanax?range%5Bsize%5D=7&level=${level}`))
            .then(res => res.json()),
        fetch(getDofus2URL('/almanax?range%5Bsize%5D=7'))
            .then(res => res.json())
    ]).then(([dofus3Data, dofus2Data]) => {
        const newItems = dofus3Data.map((d3Item: any, index: number) => 
            createAlmanaxState(d3Item, dofus2Data[index])
        );
        almanaxItems.set(newItems); 
        return newItems;
    });