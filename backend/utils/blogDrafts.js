// New blog posts written for www.yneet.in/blog, added as DRAFTS on server
// start. Each one is created only if no post with its slug exists yet, so it
// runs once and never overwrites anything. Akbar reviews each draft in the
// admin dashboard (Blog) and publishes it from there.
//
// Format for AI search (ChatGPT, Perplexity, Google AI answers): a direct
// answer in the first lines, tables, and FAQs at the end.
import BlogPost from "../models/BlogPost.js";
import { sanitizeHtml } from "./blogHtml.js";

const DRAFTS = [
  {
    slug: "how-many-mock-tests-before-neet-2027",
    title: "How Many Mock Tests Before NEET 2027? A Month-by-Month Plan",
    metaDescription:
      "Aim for about 25–30 full NEET mock tests before NEET 2027, more in the last two months, and spend as long analysing each one as taking it. Month-by-month plan for Class 12 and droppers.",
    bodyHtml: `
<p><strong>Quick answer:</strong> aim for about <strong>25–30 full-length NEET mock tests</strong> before NEET 2027. Start with one every two weeks, move to one a week from February, and take two or three a week in April. What matters more than the number is the analysis: spend about as long reviewing each mock as you spent taking it.</p>

<h2>Why the number of mocks isn't the real goal</h2>
<p>A mock test is a diagnosis, not practice by itself. Each one tells you three things: which chapters you don't know, where you make careless mistakes, and whether you can finish 180 questions in 3 hours. If you take a mock and only look at the score, you've used about a third of its value. Twenty mocks analysed properly beat fifty taken and forgotten.</p>

<h2>Month-by-month mock test plan for NEET 2027</h2>
<p>NEET is usually held in early May, in the afternoon (2:00–5:00 pm). Check the <a href="/neet-2027-exam-date">NEET 2027 exam date page</a> for the latest schedule.</p>
<table>
<thead><tr><th>Period</th><th>Full mocks</th><th>Also do</th><th>Approx. total</th></tr></thead>
<tbody>
<tr><td>November – January</td><td>1 every 2 weeks</td><td>Chapter-wise tests after each chapter you finish</td><td>6</td></tr>
<tr><td>February – March</td><td>1 every week</td><td>Revise the weak chapters each mock shows</td><td>8</td></tr>
<tr><td>April</td><td>2–3 every week</td><td>Previous year papers under exam conditions</td><td>10</td></tr>
<tr><td>Last 10 days</td><td>3–4, lighter</td><td>Formula and NCERT revision; no new topics</td><td>3–4</td></tr>
</tbody>
</table>
<p><strong>Class 12 students</strong> still finishing the syllabus can stay on the slower pace until board exams are over, using chapter tests in between. <strong>Droppers</strong> who have covered the syllabus once can start the weekly pace straight away.</p>

<h2>How to analyse a NEET mock test (the 2-hour method)</h2>
<ol>
<li><strong>Sort every wrong or skipped question into one of three groups:</strong> didn't know the concept, knew it but made a mistake (calculation, misread, wrong option marked), or guessed.</li>
<li><strong>"Didn't know" questions</strong> go on your revision list by chapter. Read that topic in NCERT the same week and practise its <a href="/neet-practice">previous year questions</a>.</li>
<li><strong>Silly mistakes</strong> go in a separate notebook. Read it before every mock; most students cut these in half within a month.</li>
<li><strong>Guesses:</strong> count how many were right. If fewer than 1 in 5 were right, guess less (see <a href="/blog/neet-negative-marking-when-to-guess">when to guess in NEET</a>).</li>
<li><strong>Check your time per subject.</strong> If one subject keeps eating more than its share, change the order you attempt them in.</li>
</ol>

<h2>Signs you're taking too many mocks</h2>
<ul>
<li>Your score has stayed flat for 4–5 mocks in a row.</li>
<li>You don't have time to revise the chapters the last mock exposed.</li>
<li>You make the same mistakes you made two weeks ago.</li>
</ul>
<p>If that's you, take fewer mocks and spend the time on the weak chapters. The <a href="/neet-most-missed-chapters">most-missed NEET chapters</a> and the <a href="/neet-chapter-wise-weightage">chapter-wise weightage</a> show where extra practice pays off most.</p>

<h2>Common questions</h2>
<h3>How many mock tests should I take before NEET?</h3>
<p>About 25–30 full-length mocks, spread from November to May, plus chapter-wise tests while you study. Analyse every mock you take.</p>
<h3>Is one mock test a day good for NEET?</h3>
<p>Only in the last few weeks, and only if you still analyse each one. Earlier in the year, daily mocks leave no time to fix what they show.</p>
<h3>When should I start NEET mock tests?</h3>
<p>Start chapter-wise tests as soon as you finish each chapter, and full mocks once you have covered most of the syllabus once. For NEET 2027, that usually means November to January.</p>
<h3>Are previous year papers better than mock tests?</h3>
<p>Do both. Previous year papers show exactly how NTA sets questions; mock tests give you new questions so you can't rely on memory.</p>

<p><strong>Try it free:</strong> take the 15-question <a href="/neet-readiness">NEET Readiness Test</a> to see where you stand, or <a href="/register">start YNeet free for 30 days</a> for full NEET mock tests with chapter-wise analysis.</p>
`,
  },
  {
    slug: "neet-negative-marking-when-to-guess",
    title: "NEET Negative Marking: When Should You Guess? (The Maths)",
    metaDescription:
      "NEET gives +4 for a correct answer and −1 for a wrong one, so a guess pays off only if your chance of being right is above 20%. Eliminate one option and guessing is worth it. Full table inside.",
    bodyHtml: `
<p><strong>Quick answer:</strong> NEET gives <strong>+4 for a correct answer, −1 for a wrong one</strong> and 0 for a skipped question. So a guess helps your score only if your chance of being right is <strong>above 20%</strong>. If you can rule out even one option with confidence, guessing is worth it. A completely blind guess is only slightly positive on average, so most students should skip those.</p>

<h2>The maths behind guessing in NEET</h2>
<p>If your chance of being right is <em>p</em>, the average marks from answering are 4 × <em>p</em> − 1 × (1 − <em>p</em>) = 5<em>p</em> − 1. That is above zero when <em>p</em> is more than 0.2, that is, 20%.</p>
<table>
<thead><tr><th>Your situation</th><th>Chance of being right</th><th>Average marks per guess</th><th>Should you answer?</th></tr></thead>
<tbody>
<tr><td>No idea, all 4 options possible</td><td>25%</td><td>+0.25</td><td>Usually skip</td></tr>
<tr><td>You can rule out 1 option</td><td>33%</td><td>+0.67</td><td>Yes</td></tr>
<tr><td>You can rule out 2 options</td><td>50%</td><td>+1.5</td><td>Yes</td></tr>
<tr><td>Fairly sure, but not certain</td><td>70%+</td><td>+2.5 or more</td><td>Yes</td></tr>
</tbody>
</table>

<h2>Why blind guesses usually aren't worth it</h2>
<p>On paper a blind guess is worth +0.25 marks. In practice, students' "random" guesses aren't random: NTA writes wrong options to look right, so a guess often lands on the trap and the real hit rate drops below 25%. A blind guess also adds risk. Ten blind guesses could just as easily cost you 10 marks as gain you a few. At the margin where a few marks change your rank, that risk matters.</p>

<h2>A simple guessing rule for NEET</h2>
<ul>
<li><strong>Know it:</strong> answer.</li>
<li><strong>Can rule out at least one option for a real reason:</strong> answer.</li>
<li><strong>No idea at all:</strong> skip, and come back only if you have time left.</li>
</ul>

<h2>Test your own guessing in mock tests</h2>
<p>Mark every guess in your mock tests (a small "G" beside the question works). After the test, count how many guesses were right:</p>
<ul>
<li><strong>More than 1 in 3 right:</strong> your eliminations are good; keep guessing this way.</li>
<li><strong>Between 1 in 5 and 1 in 3:</strong> guess only when you can rule out an option.</li>
<li><strong>Fewer than 1 in 5 right:</strong> your guesses are costing you marks; guess less.</li>
</ul>
<p>Most students find their guessing gets better as their concepts get stronger, which is one more reason to fix weak chapters first. See the <a href="/neet-most-missed-chapters">chapters students miss most</a>.</p>

<h2>Common questions</h2>
<h3>How much is the negative marking in NEET?</h3>
<p>One mark is deducted for every wrong answer. A correct answer gets 4 marks and an unanswered question gets 0.</p>
<h3>Is it good to guess in NEET?</h3>
<p>Only when your chance of being right is above 20%. If you can rule out one option, guessing pays off on average. Pure blind guesses are best skipped.</p>
<h3>How many questions should I attempt in NEET?</h3>
<p>There's no fixed number. Answer everything you know and everything where you can rule out an option; skip the rest. Your mock tests will show your best attempt count.</p>
<h3>Does marking more than one option count as wrong?</h3>
<p>Yes. Marking more than one option is treated as a wrong answer, so it loses a mark.</p>

<p><strong>Practise it:</strong> take a full NEET mock on YNeet, mark your guesses and check the result. <a href="/register">Start free for 30 days</a>, or work out your expected marks with the <a href="/neet-score-calculator">NEET score calculator</a>.</p>
`,
  },
];

export async function addBlogDrafts() {
  for (const d of DRAFTS) {
    try {
      if (await BlogPost.exists({ slug: d.slug })) continue;
      await BlogPost.create({ ...d, bodyHtml: sanitizeHtml(d.bodyHtml), status: "draft", publishedAt: null });
      console.log(`blogDrafts: added draft ${d.slug}`);
    } catch (err) {
      console.error(`blogDrafts: ${d.slug} failed: ${err.message}`);
    }
  }
}
