export const languages = ["zh", "en"] as const;
export type Language = (typeof languages)[number];
