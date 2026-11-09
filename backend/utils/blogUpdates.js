// One-time content updates to existing blog posts, applied on server start.
// Each update runs once: it checks for a marker class in the post body and
// skips the post if the marker is already there. The existing article text is
// kept; we only change the title/description and add blocks around the body.
import BlogPost from "../models/BlogPost.js";
import { sanitizeHtml } from "./blogHtml.js";

const CUTOFF_SUMMARY = `
<div class="yn-summary-2027">
<p><strong>Quick answer (updated November 2026):</strong> to qualify NEET 2027 you need roughly the 50th percentile (General/EWS) or the 40th percentile (OBC/SC/ST). In marks, expect about <strong>145–215 for General/EWS</strong> and about <strong>115–180 for OBC/SC/ST</strong>, depending on how hard the paper is. Qualifying only makes you eligible for counselling; an MBBS seat needs a much higher score.</p>
<table>
<thead><tr><th>Category</th><th>Qualifying percentile</th><th>NEET 2026 (official)</th><th>NEET 2025 (official)</th><th>NEET 2027 (expected)</th></tr></thead>
<tbody>
<tr><td>General / EWS</td><td>50th</td><td>715–213</td><td>686–144</td><td>about 145–215</td></tr>
<tr><td>OBC</td><td>40th</td><td>212–177</td><td>143–113</td><td>about 115–180</td></tr>
<tr><td>SC</td><td>40th</td><td>212–177</td><td>143–113</td><td>about 115–180</td></tr>
<tr><td>ST</td><td>40th</td><td>212–177</td><td>143–113</td><td>about 115–180</td></tr>
<tr><td>General-PwBD</td><td>45th</td><td>see NTA notice</td><td>143–127</td><td>about 130–200</td></tr>
</tbody>
</table>
<p>2026 figures are from the NEET UG 2026 (re-exam) result; 2025 figures from the NEET UG 2025 result. The 2027 range is our estimate from these two years, not an official number.</p>
<p><a href="/neet-college-predictor">Check which MBBS colleges your expected score can get →</a></p>
</div>`;

const CUTOFF_FAQ = `
<div class="yn-faq">
<h2>NEET 2027 cutoff: common questions</h2>
<h3>What are the NEET 2027 qualifying marks?</h3>
<p>NTA announces them with the result. Based on 2025 and 2026, expect about 145–215 marks for General/EWS (50th percentile) and about 115–180 for OBC, SC and ST (40th percentile).</p>
<h3>What is the passing mark for NEET 2027?</h3>
<p>There is no fixed pass mark. You "pass" (qualify) by reaching your category's percentile: 50th for General/EWS, 45th for General-PwBD and 40th for OBC, SC and ST. Last year that meant 213 marks for General and 177 for OBC/SC/ST.</p>
<h3>What is a safe score for NEET 2027?</h3>
<p>Qualifying is not enough for a government MBBS seat. The safe score depends on your category, state quota and the colleges you want, so check last year's closing ranks for your category in the <a href="/neet-college-predictor">YNeet NEET College Predictor</a>.</p>
<h3>What is the NEET 2027 cutoff for SC and OBC?</h3>
<p>SC, ST and OBC candidates qualify at the 40th percentile. In NEET 2026 this was 212–177 marks and in NEET 2025 it was 143–113; expect about 115–180 for 2027.</p>
<h3>When will the NEET 2027 cutoff be released?</h3>
<p>Along with the NEET 2027 result, usually in June. See the <a href="/neet-2027-exam-date">NEET 2027 exam date page</a> for the latest schedule.</p>
<h3>How can I check my expected NEET score?</h3>
<p>Take the free <a href="/neet-readiness">NEET Readiness Test</a> or a full mock test on YNeet, then compare your score with the table above.</p>
</div>`;

const UPDATES = [
  {
    slug: "neet-cutoff-2027",
    marker: "yn-summary-2027",
    title: "NEET 2027 Cutoff: Expected Qualifying Marks & Safe Score",
    metaDescription:
      "Expected NEET 2027 qualifying marks for General, OBC, SC, ST & EWS, with official 2026 and 2025 cutoffs, passing marks and safe score for MBBS. Updated Nov 2026.",
    before: CUTOFF_SUMMARY,
    after: CUTOFF_FAQ,
  },
];

// Text fixes applied to every post: the ₹99 five-day trial was replaced by a
// free 30-day trial (Oct 2026). Runs on every start; a post is only saved when
// something actually matched, so it does nothing once the text is gone.
const TEXT_FIXES = [
  [/Start your ₹\s?99 (five|5)[- ]day trial/gi, "Start your free 30-day trial"],
  [/(a |the )?₹\s?99 (five|5)[- ]day trial/gi, "a free 30-day trial"],
  [/(five|5)[- ]day trial for ₹\s?99/gi, "free 30-day trial"],
  [/start trial for ₹\s?99/gi, "Start your free 30-day trial"],
  [/trial (costs|is|for) (just |only )?₹\s?99/gi, "trial is free for 30 days"],
];

async function applyTextFixes() {
  const posts = await BlogPost.find({ bodyHtml: /99/ });
  for (const post of posts) {
    let body = post.bodyHtml || "";
    let title = post.title || "";
    let meta = post.metaDescription || "";
    for (const [re, to] of TEXT_FIXES) { body = body.replace(re, to); title = title.replace(re, to); meta = meta.replace(re, to); }
    for (const m of body.matchAll(/₹\s?99\b/g)) console.log(`blogUpdates: ${post.slug} ₹99 context: ${body.slice(Math.max(0, m.index - 120), m.index + 80).replace(/\s+/g, " ")}`);
    if (body === post.bodyHtml && title === post.title && meta === post.metaDescription) {
      if (/₹\s?99\b/.test(body)) console.log(`blogUpdates: ${post.slug} mentions ₹99 in wording not matched — check by hand`);
      continue;
    }
    post.bodyHtml = body; post.title = title; post.metaDescription = meta;
    await post.save();
    const left = /₹\s?99\b/.test(body) ? " (still mentions ₹99 somewhere — check by hand)" : "";
    console.log(`blogUpdates: replaced ₹99 trial text in ${post.slug}${left}`);
  }
}

export async function applyBlogUpdates() {
  try { await applyTextFixes(); } catch (err) { console.error(`blogUpdates: text fixes failed: ${err.message}`); }
  for (const u of UPDATES) {
    try {
      const post = await BlogPost.findOne({ slug: u.slug });
      if (!post) { console.warn(`blogUpdates: no post with slug ${u.slug}`); continue; }
      if ((post.bodyHtml || "").includes(u.marker)) continue;
      post.title = u.title;
      post.metaDescription = u.metaDescription;
      post.bodyHtml = sanitizeHtml(`${u.before}\n${post.bodyHtml || ""}\n${u.after}`);
      await post.save();
      console.log(`blogUpdates: updated ${u.slug}`);
    } catch (err) {
      console.error(`blogUpdates: ${u.slug} failed: ${err.message}`);
    }
  }
}
