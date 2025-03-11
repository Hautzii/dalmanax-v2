import { AlmanaxStateSchema, type AlmanaxState } from '$lib/types/AlmanaxState';
import { Dofus3DataSchema, type Dofus3Data } from '$lib/types/AlmanaxDataType';
import { sourceLanguageTag, languageTag } from '$lib/paraglide/runtime';

const BASE_URL = {
  dofus3: 'https://api.dofusdu.de/dofus3/v1',
  dofus2: 'https://api.dofusdu.de/dofus2'
};

const getURL = (base: keyof typeof BASE_URL, path: string) => 
  `${BASE_URL[base]}/${languageTag() || sourceLanguageTag}${path}`;

const fetchDofus2Image = async (itemName: string, ankamaId: number): Promise<string | null> => {
  try {
    const response = await fetch(getURL('dofus2', `/items/search?query=${encodeURIComponent(itemName)}&limit=1`));
    if (!response.ok) return null;
    
    const data = await response.json();
    return (data[0]?.ankama_id === ankamaId && data[0]?.image_urls?.hd) ? data[0].image_urls.hd : null;
  } catch {
    return null;
  }
};

const createAlmanaxState = async (dofus3Data: Dofus3Data): Promise<AlmanaxState> => {
  const dofus2Image = await fetchDofus2Image(dofus3Data.tribute.item.name, dofus3Data.tribute.item.ankama_id);
  const hdImage = dofus3Data.tribute.item.image_urls?.hd;
  const sdImage = dofus3Data.tribute.item.image_urls?.sd;
  
  return AlmanaxStateSchema.parse({
    bonus: dofus3Data.bonus.type.name,
    bonus_id: dofus3Data.bonus.type.id,
    description: dofus3Data.bonus.description,
    date: new Date(dofus3Data.date).toISOString().split('T')[0],
    image: dofus2Image || hdImage || sdImage || '',
    loot: dofus3Data.tribute.item.name,
    quantity: dofus3Data.tribute.quantity,
    reward_kamas: dofus3Data.reward_kamas,
    reward_xp: dofus3Data.reward_xp,
    subtype: dofus3Data.tribute.item.subtype,
    loot_id: dofus3Data.tribute.item.ankama_id
  });
};

export const fetchAlmanaxData = async (level: number): Promise<AlmanaxState[]> => {
  try {
    const response = await fetch(getURL('dofus3', `/almanax?range%5Bsize%5D=7&level=${level}`));
    const data = await response.json();
    const validatedData = Dofus3DataSchema.array().parse(data);
    
    return Promise.all(validatedData.map(createAlmanaxState));
  } catch (error) {
    console.error('Error fetching almanax data:', error);
    return [];
  }
};