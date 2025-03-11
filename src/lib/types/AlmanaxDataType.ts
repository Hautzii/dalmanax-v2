import { z } from 'zod';

export const Dofus3DataSchema = z.object({
  bonus: z.object({
    type: z.object({
      name: z.string(),
      id: z.string()
    }),
    description: z.string()
  }),
  date: z.string(),
  tribute: z.object({
    item: z.object({
      name: z.string(),
      image_urls: z.object({
        sd: z.string().optional(),
        hd: z.string().optional()
      }),
      subtype: z.string(),
      ankama_id: z.number()
    }),
    quantity: z.number()
  }),
  reward_kamas: z.number(),
  reward_xp: z.number()
});

export type Dofus3Data = z.infer<typeof Dofus3DataSchema>;