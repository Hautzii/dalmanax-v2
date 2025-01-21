import type { AlmanaxState } from '$lib/types/AlmanaxState';
import type { Dofus2Data, Dofus3Data } from '$lib/types/AlmanaxDataTypes';
import { sourceLanguageTag, languageTag } from '$lib/paraglide/runtime';

const BASE_URL_DOFUS3 = 'https://api.dofusdu.de/dofus3/v1';
const BASE_URL_DOFUS2 = 'https://api.dofusdu.de/dofus2';
const RANGE_QUERY = 'range%5Bsize%5D=7';

const getDofus3URL = (path: string) => `${BASE_URL_DOFUS3}/${languageTag() || sourceLanguageTag}${path}`;
const getDofus2URL = (path: string) => `${BASE_URL_DOFUS2}/${languageTag() || sourceLanguageTag}${path}`;

const createAlmanaxState = (dofus3Data: Dofus3Data, dofus2Data: Dofus2Data): AlmanaxState => ({
    bonus: dofus3Data.bonus.type.name,
    bonus_id: dofus3Data.bonus.type.id,
    description: dofus3Data.bonus.description,
    date: new Date(dofus3Data.date).toISOString().split('T')[0],
    image: dofus2Data?.tribute?.item?.image_urls?.hd ?? 
           dofus3Data.tribute.item.image_urls.sd ?? 
           dofus3Data.tribute.item.image_urls.hd,
    loot: dofus3Data.tribute.item.name,
    quantity: dofus3Data.tribute.quantity,
    reward_kamas: dofus3Data.reward_kamas,
    reward_xp: dofus3Data.reward_xp,
    subtype: dofus3Data.tribute.item.subtype,
    loot_id: dofus3Data.tribute.item.ankama_id
  });

export const fetchAlmanaxData = async (level: number, language: string): Promise<AlmanaxState[]> => {
    const [dofus3Data, dofus2Data] = await Promise.all([
      fetch(getDofus3URL(`/almanax?${RANGE_QUERY}&level=${level}&language=${language}`)).then(res => res.json()),
      fetch(getDofus2URL(`/almanax?${RANGE_QUERY}&language=${language}`)).then(res => res.json())
    ]);
  
    return dofus3Data.map((d3Item: Dofus3Data, index: number) =>
      createAlmanaxState(d3Item, dofus2Data[index])
    );
};