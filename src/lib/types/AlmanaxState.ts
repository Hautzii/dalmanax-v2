import { z } from 'zod';

export const AlmanaxStateSchema = z.object({
  description: z.string(),
  bonus: z.string(),
  bonus_id: z.string(),
  date: z.string(),
  image: z.string(),
  loot: z.string(),
  quantity: z.number(),
  reward_kamas: z.number(),
  reward_xp: z.number(),
  subtype: z.string(),
  loot_id: z.number()
});

export type AlmanaxState = z.infer<typeof AlmanaxStateSchema>;
