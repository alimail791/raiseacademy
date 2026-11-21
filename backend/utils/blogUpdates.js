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


// Safe score for government MBBS, from YNeet's own 2026 MCC All India Quota
// data (backend/data/predictor/mcc_aiq_2026.csv): closing ranks of government,
// AIIMS, JIPMER and ESIC MBBS seats, main rounds (not stray), converted to marks
// with the Re-NEET 2026 marks-vs-rank curve (frontend/src/score/scoring.ts).
// Search Console (Nov 2026): this post got 3,800+ impressions at position ~5
// for "safe score for neet 2027 <category>" but almost no clicks, because it
// had no safe-score number.
const SAFE_SCORE = `
<div class="yn-safe-score-2027">
<h2>NEET 2027 safe score for government MBBS (by category)</h2>
<p>Qualifying marks only make you eligible. To get a <strong>government MBBS seat through the 15% All India Quota</strong>, aim for the "safe target" below. These numbers come from the closing ranks of every government MBBS college (including AIIMS, JIPMER and ESIC) in MCC counselling 2026, converted to marks using the NEET 2026 (re-exam) marks-vs-rank data.</p>
<table>
<thead><tr><th>Category</th><th>Last AIQ govt MBBS seat, 2026</th><th>Half of AIQ govt colleges, 2026</th><th>Safe target for 2027</th></tr></thead>
<tbody>
<tr><td>General</td><td>AIR 25,655 (about 558 marks)</td><td>about 580 marks</td><td><strong>600+</strong></td></tr>
<tr><td>EWS</td><td>AIR 29,743 (about 551 marks)</td><td>about 570 marks</td><td><strong>590+</strong></td></tr>
<tr><td>OBC</td><td>AIR 25,768 (about 558 marks)</td><td>about 578 marks</td><td><strong>600+</strong></td></tr>
<tr><td>SC</td><td>AIR 1,20,870 (about 471 marks)</td><td>about 503 marks</td><td><strong>520+</strong></td></tr>
<tr><td>ST</td><td>AIR 1,32,111 (about 463 marks)</td><td>about 492 marks</td><td><strong>510+</strong></td></tr>
</tbody>
</table>
<p><strong>How to read this:</strong> the "safe target" is the score that would have got a seat in about three out of four AIQ government colleges in 2026. Ranks are exact; marks are estimates (the marks-vs-rank curve is official at 500 and 600 marks and estimated in between). A tougher paper lowers the marks needed for the same rank: in NEET 2025, AIR 25,000 was about 530 marks.</p>
<p><strong>State quota is often easier.</strong> 85% of government seats go through your state's counselling, where the closing rank can be much higher (easier) than AIQ, especially for SC, ST and OBC. Check your state: <a href="/neet-cutoff">NEET cutoff by state</a>.</p>
<p><a href="/neet-college-predictor">See the exact colleges your score can get →</a> · <a href="/neet-rank-predictor">Convert your marks to an All India Rank →</a></p>
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
  {
    slug: "neet-cutoff-2027",
    marker: "yn-safe-score-2027",
    title: "NEET 2027 Safe Score & Cutoff: Govt MBBS Marks by Category (600+ General)",
    metaDescription:
      "NEET 2027 safe score for government MBBS: about 600+ General/OBC, 590+ EWS, 520+ SC, 510+ ST, from 2026 AIQ closing ranks. Plus expected qualifying marks 145–215 (General).",
    // Placed right after the quick-answer summary, not at the very top.
    afterMarker: "yn-summary-2027",
    before: SAFE_SCORE,
    after: "",
    replace: [[
      /<h3>What is a safe score for NEET 2027\?<\/h3>\s*<p>[\s\S]*?<\/p>/,
      "<h3>What is a safe score for NEET 2027?</h3>\n<p>For a government MBBS seat through the All India Quota, aim for about 600+ (General and OBC), 590+ (EWS), 520+ (SC) and 510+ (ST). These are based on 2026 AIQ closing ranks; state quota seats often need less. See the safe score table above and check exact colleges in the <a href=\"/neet-college-predictor\">YNeet NEET College Predictor</a>.</p>",
    ]],
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
  [/Try YNeet for ₹\s?99/gi, "Try YNeet free for 30 days"],
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
      let body = post.bodyHtml || "";
      for (const [re, to] of u.replace || []) body = body.replace(re, to);
      // afterMarker: insert `before` right after that earlier block (it has no nested <div>).
      const at = u.afterMarker ? body.indexOf(`class="${u.afterMarker}"`) : -1;
      const end = at >= 0 ? body.indexOf("</div>", at) : -1;
      body = end >= 0
        ? `${body.slice(0, end + 6)}\n${u.before}\n${body.slice(end + 6)}${u.after ? `\n${u.after}` : ""}`
        : `${u.before}\n${body}${u.after ? `\n${u.after}` : ""}`;
      post.bodyHtml = sanitizeHtml(body);
      await post.save();
      console.log(`blogUpdates: updated ${u.slug}`);
    } catch (err) {
      console.error(`blogUpdates: ${u.slug} failed: ${err.message}`);
    }
  }
}
