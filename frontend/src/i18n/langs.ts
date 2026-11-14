// Language codes on their own, so App.tsx can build the /ta/… routes without
// pulling all the regional page text (regional.ts) into the main bundle.
export type Lang = "ta" | "hi" | "te" | "kn";
export const LANGS: Lang[] = ["ta", "hi", "te", "kn"];
