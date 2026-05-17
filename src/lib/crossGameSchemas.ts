import { z } from 'zod';

export const RecentGameEntrySchema = z.object({
  slug: z.string().min(1).max(64),
  at: z.number().int().nonnegative(),
});
export const RecentGamesSchema = z.array(RecentGameEntrySchema).max(20);
export type RecentGameEntry = z.infer<typeof RecentGameEntrySchema>;
export type RecentGames = z.infer<typeof RecentGamesSchema>;

export const FavoritesSchema = z.array(z.string().min(1).max(64)).max(64);
export type Favorites = z.infer<typeof FavoritesSchema>;

const CategorySchema = z.enum(['logik', 'wort', 'action', 'gehirntraining', 'karten', 'werkzeuge']);
export const HomeCategoryFilterSchema = z.union([CategorySchema, z.literal('all')]);
export type HomeCategoryFilter = z.infer<typeof HomeCategoryFilterSchema>;

export const ThemeSchema = z.enum(['system', 'light', 'dark']);
export type Theme = z.infer<typeof ThemeSchema>;

export const SettingsSchema = z.object({
  theme: ThemeSchema,
  vibration: z.boolean(),
  sound: z.boolean(),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const DEFAULT_SETTINGS: Settings = { theme: 'system', vibration: true, sound: true };
