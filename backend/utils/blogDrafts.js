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
  {
    slug: "neet-2027-six-month-study-plan",
    title: "NEET 2027: A 6-Month Study Plan From November to May",
    metaDescription:
      "About six months are left for NEET 2027. Split them into three phases: finish and fix the syllabus (Nov–Jan), revise with weekly mocks (Feb–Mar), then full exam practice (Apr–May). Month-by-month plan with a daily timetable.",
    bodyHtml: `
<p><strong>Quick answer:</strong> with about six months left for NEET 2027, split the time into three phases. <strong>November to January:</strong> finish the syllabus and test each chapter. <strong>February and March:</strong> revise weak chapters and take one full mock a week. <strong>April to the exam:</strong> full exam practice, two or three mocks a week, and NCERT revision only. Biology is half the paper, so give it the most time.</p>

<h2>Why six months is enough</h2>
<p>NEET has 180 questions in 3 hours: 90 from Biology, 45 from Physics and 45 from Chemistry, for 720 marks. Most questions come from NCERT Class 11 and 12. You don't need new books or new topics in the last six months. You need to finish what's left, find your weak chapters and fix them, and practise enough full papers that 3 hours feels normal. Check the <a href="/neet-2027-exam-date">NEET 2027 exam date page</a> for the latest schedule.</p>

<h2>The 3-phase plan at a glance</h2>
<table>
<thead><tr><th>Phase</th><th>Months</th><th>Main goal</th><th>Full mocks</th></tr></thead>
<tbody>
<tr><td>1. Finish and fix</td><td>November – January</td><td>Complete the syllabus; a chapter test after every chapter</td><td>1 every 2 weeks</td></tr>
<tr><td>2. Revise</td><td>February – March</td><td>Second reading of NCERT; work on weak chapters</td><td>1 every week</td></tr>
<tr><td>3. Exam practice</td><td>April – exam</td><td>Full papers in exam timing; revision only</td><td>2–3 every week</td></tr>
</tbody>
</table>

<h2>Phase 1: November to January — finish and fix</h2>
<ul>
<li><strong>List what's left.</strong> Write down every chapter you haven't finished and put the high-weightage ones first. The <a href="/neet-chapter-wise-weightage">chapter-wise weightage</a> page shows which chapters carry the most questions.</li>
<li><strong>Test each chapter as you finish it.</strong> 30–45 questions from that chapter, the same day or the next. If you score below 60%, re-read it before moving on.</li>
<li><strong>Start full mocks.</strong> One every two weeks is enough now. The goal is to get used to 3 hours, not to score high.</li>
<li><strong>Class 12 students:</strong> board preparation and NEET overlap heavily in Biology and Chemistry. Study the NCERT chapter once for both, then add NEET MCQs on top.</li>
</ul>

<h2>Phase 2: February and March — revise</h2>
<ul>
<li><strong>Second reading of NCERT Biology</strong>, line by line, including diagrams, tables and examples. This is where most marks are won.</li>
<li><strong>One full mock every week</strong>, on the same day and at the exam time (2:00–5:00 pm) if you can.</li>
<li><strong>Fix the chapters each mock exposes.</strong> Keep a list of weak chapters and clear two or three every week.</li>
<li><strong>Physics:</strong> make a one-page formula sheet per chapter and practise numericals daily, even 15–20 questions.</li>
</ul>

<h2>Phase 3: April to the exam — exam practice</h2>
<ul>
<li><strong>Two or three full mocks a week</strong>, plus previous year papers under exam conditions.</li>
<li><strong>No new topics.</strong> If a chapter is still weak in April, learn its most-asked parts and move on.</li>
<li><strong>Revise from your own notes</strong>: formula sheets, the silly-mistakes notebook and NCERT highlights.</li>
<li><strong>Last 10 days:</strong> lighter mocks, enough sleep, and the exam-day routine (wake-up time, meals, travel to the centre).</li>
</ul>

<h2>A sample daily timetable (dropper)</h2>
<table>
<thead><tr><th>Time</th><th>What to do</th></tr></thead>
<tbody>
<tr><td>6:30 – 9:30 am</td><td>Biology: NCERT reading + 50 MCQs</td></tr>
<tr><td>10:00 am – 1:00 pm</td><td>Physics: concepts + numericals</td></tr>
<tr><td>2:00 – 5:00 pm</td><td>Chemistry (or a full mock on mock day)</td></tr>
<tr><td>6:00 – 8:00 pm</td><td>Revise the day's weak spots; mock analysis</td></tr>
<tr><td>9:00 – 9:30 pm</td><td>Quick revision of today's notes</td></tr>
</tbody>
</table>
<p><strong>Class 12 students</strong> can use the same order with shorter blocks: about 3–4 hours on school days and 7–8 on weekends.</p>

<h2>Mistakes that waste these six months</h2>
<ul>
<li>Switching books or courses every few weeks.</li>
<li>Taking mocks without analysing them.</li>
<li>Skipping Physics because it feels hard; even 100–120 marks in Physics changes your rank a lot.</li>
<li>Studying only favourite chapters. The <a href="/neet-most-missed-chapters">most-missed NEET chapters</a> are where extra practice pays off.</li>
</ul>

<h2>Common questions</h2>
<h3>Is 6 months enough to prepare for NEET 2027?</h3>
<p>Yes, if you have studied the Class 11 and 12 syllabus once. Use the first three months to finish and fix, and the last three to revise and practise full papers.</p>
<h3>How many hours a day should I study for NEET?</h3>
<p>Droppers: about 8–10 focused hours. Class 12 students: 3–4 hours on school days and more on weekends. Consistency matters more than long single days.</p>
<h3>Should I focus more on Biology?</h3>
<p>Biology is 360 of the 720 marks, so it deserves the most time. But don't drop Physics or Chemistry; each is 180 marks.</p>
<h3>When should I start full mock tests?</h3>
<p>Now. One every two weeks until January, then weekly, then two or three a week from April. See <a href="/blog/how-many-mock-tests-before-neet-2027">how many mock tests to take</a>.</p>

<p><strong>Start today:</strong> take the free 15-question <a href="/neet-readiness">NEET Readiness Test</a> to see where you stand, then <a href="/register">try YNeet free for 30 days</a> for chapter tests, full NEET mocks and a chapter priority study plan.</p>
`,
  },
  {
    slug: "how-to-read-ncert-biology-for-neet",
    title: "How to Read NCERT Biology for NEET: A Line-by-Line Method",
    metaDescription:
      "Biology is 360 of 720 NEET marks, and most questions come straight from NCERT lines, diagrams and tables. Read each chapter three times with a different goal each time, then test it with MCQs the same day.",
    bodyHtml: `
<p><strong>Quick answer:</strong> Biology is <strong>90 of the 180 NEET questions (360 of 720 marks)</strong>, and most questions are built from NCERT lines, diagrams and tables. Read each NCERT Biology chapter <strong>three times, with a different goal each time</strong>: understand it, then mark every fact line by line, then study the diagrams and tables. Test the chapter with MCQs the same day and trace every wrong answer back to the NCERT line.</p>

<h2>Why NCERT Biology matters so much</h2>
<p>NEET Biology questions are often a single NCERT sentence turned into a question: an example, an exception, a number or a label from a figure. Reference books help with practice, but the answer is usually in NCERT. Students who score 330+ in Biology typically know NCERT so well they can tell which line a question came from.</p>

<h2>The 3-reading method</h2>
<table>
<thead><tr><th>Reading</th><th>Goal</th><th>What to do</th></tr></thead>
<tbody>
<tr><td>1st</td><td>Understand</td><td>Read the chapter like a story. No highlighting. Note anything you don't understand.</td></tr>
<tr><td>2nd</td><td>Mark facts</td><td>Line by line. Highlight names, numbers, examples, exceptions and "only", "not", "except" statements.</td></tr>
<tr><td>3rd</td><td>Visuals</td><td>Every diagram, label, table and figure caption. Redraw key diagrams once from memory.</td></tr>
</tbody>
</table>

<h2>Step by step for one chapter</h2>
<ol>
<li><strong>Read the chapter once</strong> to understand it (45–60 minutes).</li>
<li><strong>Read it again, line by line</strong>, highlighting facts. Write tricky points in the margin, not in a separate notebook.</li>
<li><strong>Go through every diagram and table.</strong> Cover the labels and try to name them.</li>
<li><strong>Take 40–50 MCQs on the chapter</strong> the same day, including <a href="/neet-practice">previous year questions</a>.</li>
<li><strong>For every wrong answer, find the NCERT line</strong> it came from and mark it with a star. These starred lines are your revision list.</li>
<li><strong>Revise the starred lines</strong> after 3 days, 1 week and 1 month.</li>
</ol>

<h2>What to look for when reading line by line</h2>
<ul>
<li><strong>Examples:</strong> organisms, plants and diseases named in the text are frequently asked.</li>
<li><strong>Exceptions:</strong> lines with "except", "only", "not" or "unlike".</li>
<li><strong>Numbers:</strong> chromosome numbers, ATP counts, percentages and dates.</li>
<li><strong>Tables:</strong> comparison tables are often turned into match-the-column questions.</li>
<li><strong>Figure captions and labels:</strong> diagram-based questions are common in Botany and Zoology.</li>
</ul>

<h2>Which chapters to read first</h2>
<p>Start with the chapters that carry the most questions. Genetics and evolution, human physiology, plant physiology, reproduction, ecology and biotechnology together make up a large share of the Biology paper. The <a href="/neet-chapter-wise-weightage">chapter-wise weightage</a> page has the full list, and the <a href="/neet-most-missed-chapters">most-missed chapters</a> page shows where students lose the most marks.</p>

<h2>Common mistakes</h2>
<ul>
<li><strong>Reading once and moving to guides.</strong> One reading leaves most of the small facts unread.</li>
<li><strong>Highlighting everything.</strong> If the whole page is yellow, nothing stands out. Highlight facts, not sentences.</li>
<li><strong>Skipping diagrams and boxes.</strong> These are question sources too.</li>
<li><strong>Reading without testing.</strong> MCQs show what you only think you know.</li>
</ul>

<h2>Common questions</h2>
<h3>Is NCERT enough for NEET Biology?</h3>
<p>For theory, NCERT covers most of what is asked. Add MCQ practice and previous year questions to learn how the facts are tested.</p>
<h3>How many times should I read NCERT Biology for NEET?</h3>
<p>At least three focused readings per chapter before the exam, plus regular revision of the lines you got wrong in MCQs.</p>
<h3>Should I make separate notes for NCERT Biology?</h3>
<p>Short margin notes and a list of starred lines work better than rewriting the book. Save time for MCQs.</p>
<h3>How long does one NCERT Biology chapter take?</h3>
<p>About 3–4 hours for the three readings and the MCQ test, spread over one or two days.</p>

<p><strong>Practise it:</strong> YNeet has chapter-wise NCERT Biology MCQs with explanations and a chapter priority study plan. <a href="/register">Start free for 30 days</a>, or take the 15-question <a href="/neet-readiness">NEET Readiness Test</a> first.</p>
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
