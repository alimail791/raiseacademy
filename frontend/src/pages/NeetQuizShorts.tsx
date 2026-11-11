import { useInitialPracticeData } from "../practice/practiceData";
import { ShortCard, useQuizShorts } from "../components/QuizShorts";

// /neet-quiz-shorts — every daily NEET quiz Short (YouTube), newest first,
// each linking to its question's page with the answer and explanation.
const NeetQuizShorts = () => {
  const initial = useInitialPracticeData();
  const shorts = useQuizShorts(200, initial.quizShorts);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="text-gold-dark font-semibold uppercase tracking-widest text-sm">Free · 25 seconds each</p>
      <h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">Daily NEET Quiz Shorts</h1>
      <p className="text-ink/70 dark:text-paper/70 mt-3 text-lg max-w-3xl">
        Three NEET questions every day, one each from Physics, Chemistry and Biology, mostly from previous NEET papers. Read the question, answer before the 5-second timer ends, then see the answer and the explanation.
      </p>
      {shorts === null && <p className="mt-10 text-ink/50">Loading…</p>}
      {shorts && !shorts.length && <p className="mt-10 text-ink/60">The first quiz Shorts are on their way. Check back soon.</p>}
      {shorts && shorts.length > 0 && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {shorts.map((s) => <ShortCard key={s.videoId} s={s} />)}
        </div>
      )}
      <p className="mt-10 text-sm text-ink/60 dark:text-paper/60">New Shorts go up at 8 am, 1 pm and 7 pm every day on our YouTube channel.</p>
    </div>
  );
};

export default NeetQuizShorts;
