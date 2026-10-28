import { ParentReportSection, FeatureGroups, CompareTable } from "../components/YNeetSales";

// Landing page for parent-focused ads: the weekly report first, then what the
// child gets and the price comparison parents care about.
const NeetParents = () => (
  <div>
    <div className="bg-gold/10 border-b border-gold/20"><ParentReportSection standalone /></div>
    <FeatureGroups heading="What your child gets on YNeet" />
    <div className="border-t border-ink/10"><CompareTable /></div>
  </div>
);

export default NeetParents;
