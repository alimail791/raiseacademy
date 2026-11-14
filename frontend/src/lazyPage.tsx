// Route-level code splitting that still works with the build-time prerender.
//
// Each page module becomes its own JS chunk, so a visitor to the homepage no
// longer downloads the admin panel, college predictor, photo resizer, etc.
//
// - Prerender (scripts/prerender.mjs) calls preloadAllPages() first, so every
//   page renders synchronously into the HTML, exactly as before.
// - In the browser, main.tsx hydrates the prerendered HTML. If the page's chunk
//   isn't loaded yet, React keeps the server HTML on screen (inside the
//   <Suspense> in App.tsx) and hydrates it once the chunk arrives.
// - Link navigation in React Router runs in a transition, so the current page
//   stays visible while the next page's chunk loads.
import { lazy, type ComponentType } from "react";

type Mod = Record<string, unknown>;
const preloaders: Array<() => Promise<void>> = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = any;
export function page(load: () => Promise<Mod>, exportName = "default") {
  let Loaded: ComponentType<AnyProps> | null = null;
  const pick = (m: Mod) => m[exportName] as ComponentType<AnyProps>;
  const preload = () => load().then((m) => { Loaded = pick(m); });
  preloaders.push(preload);
  const Lazy = lazy(() => load().then((m) => { Loaded = pick(m); return { default: Loaded }; }));
  const Page = (props: AnyProps) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return Page;
}

export const preloadAllPages = () => Promise.all(preloaders.map((p) => p())).then(() => undefined);
