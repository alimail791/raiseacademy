import FeaturedShortsSection from "../components/FeaturedShortsSection";

// YNeet Shorts: short NEET concept videos by teachers. The same section as on the
// home page, as its own page so the app's Explore screen can open it.
const NeetShorts = () => (
  <div>
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
      <h1 className="font-display text-3xl font-bold">YNeet Shorts</h1>
      <p className="mt-2 text-ink/70">Quick NEET concept videos from teachers, under 2 minutes each.</p>
    </div>
    <FeaturedShortsSection />
  </div>
);

export default NeetShorts;
