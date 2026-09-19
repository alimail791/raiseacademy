import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight } from "lucide-react";

type Question = {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOpt: number;
  explanation: string;
};

type Quiz = { Physics: Question[]; Chemistry: Question[]; Biology: Question[] };

const SUBJECTS: Array<keyof Quiz> = ["Physics", "Chemistry", "Biology"];

// Embedded directly on the landing page (Home.tsx) rather than a separate
// /free-test route — visitors scroll down and take it right here, no
// navigation away from the page that's selling them on registering.
const FreeTestSection = () => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<keyof Quiz>("Physics");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Calls YNeet's own backend directly (a different origin from this site)
    // — a public, no-login endpoint made specifically for this taster quiz.
    axios
      .get(`${import.meta.env.VITE_YNEET_API_URL}/public/sample-quiz`)
      .then((res) => setQuiz(res.data.questions))
      .catch(() => setError("Couldn't load the free test right now — please try again shortly."))
      .finally(() => setLoading(false));
  }, []);

  const questions = quiz?.[subject] || [];
  const q = questions[current];

  const answer = (idx: number) => {
    if (!q || revealed[q.id]) return;
    setAnswers((a) => ({ ...a, [q.id]: idx }));
    setRevealed((r) => ({ ...r, [q.id]: true }));
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      const subjIdx = SUBJECTS.indexOf(subject);
      if (subjIdx < SUBJECTS.length - 1) {
        setSubject(SUBJECTS[subjIdx + 1]);
        setCurrent(0);
      } else {
        setFinished(true);
      }
    }
  };

  const switchSubject = (s: keyof Quiz) => {
    setSubject(s);
    setCurrent(0);
  };

  const allQuestions = quiz ? SUBJECTS.flatMap((s) => quiz[s]) : [];
  const correctCount = allQuestions.filter((qq) => answers[qq.id] === qq.correctOpt).length;
  const answeredCount = Object.keys(answers).length;

  return (
    <section id="free-test" className="max-w-2xl mx-auto px-4 py-16 scroll-mt-20">
      {loading && (
        <p className="text-center text-ink/60 py-10">Loading your free test...</p>
      )}

      {!loading && (error || !quiz) && (
        <p className="text-center text-red-600 py-10">{error || "Something went wrong."}</p>
      )}

      {!loading && quiz && finished && (
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Nice work! 🎉</h2>
          <p className="text-5xl font-bold text-gold mb-2">
            {correctCount}
            <span className="text-2xl text-ink/40">/{allQuestions.length}</span>
          </p>
          <p className="text-ink/60 mb-10">
            {Math.round((correctCount / allQuestions.length) * 100)}% correct across Physics, Chemistry &amp; Biology.
          </p>
          <div className="bg-rise-line text-paper rounded-2xl p-8 mb-8">
            <h3 className="font-display text-xl font-bold mb-2">This was just 30 questions.</h3>
            <p className="text-paper/80 mb-6">
              YNeet gives you 30 full mock tests, daily quizzes, a practice bank of hundreds of questions, a mistake
              notebook, flashcards, formula sheets — all scoped to your exact class syllabus.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors"
            >
              Register Free &amp; Unlock Everything <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {!loading && quiz && !finished && q && (
        <>
          <div className="text-center mb-8">
            <p className="uppercase tracking-widest text-gold text-sm font-semibold mb-2">Free NEET Mock Test</p>
            <h2 className="font-display text-3xl font-bold">10 Questions Each — Physics, Chemistry &amp; Biology</h2>
            <p className="text-ink/60 mt-2">No login needed. See instantly whether you got it right.</p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => switchSubject(s)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  s === subject ? "bg-rise-line text-paper" : "bg-ink/5 text-ink/60 hover:bg-ink/10"
                }`}
              >
                {s} ({quiz[s].length})
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-ink/50 mb-6">
            Question {current + 1} of {questions.length} · {answeredCount}/{allQuestions.length} answered overall
          </p>

          <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wide bg-gold/15 text-gold-dark px-3 py-1 rounded-full">
                {q.subject}
              </span>
              <span className="text-xs text-ink/50 self-center">{q.chapter} · {q.topic}</span>
            </div>

            <p className="font-medium text-ink mb-5 leading-relaxed">{q.questionText}</p>

            <div className="space-y-2 mb-4">
              {([[q.optionA, "A"], [q.optionB, "B"], [q.optionC, "C"], [q.optionD, "D"]] as Array<[string, "A" | "B" | "C" | "D"]>).map(([text, letter], idx) => {
                const isCorrect = idx === q.correctOpt;
                const isSelected = idx === answers[q.id];
                let cls = "border-ink/15 hover:border-gold/60";
                if (revealed[q.id]) {
                  if (isCorrect) cls = "border-green-500 bg-green-50";
                  else if (isSelected) cls = "border-red-400 bg-red-50";
                  else cls = "border-ink/10 opacity-60";
                }
                return (
                  <button
                    key={letter}
                    onClick={() => answer(idx)}
                    disabled={revealed[q.id]}
                    className={`w-full text-left flex gap-3 items-start border rounded-xl px-4 py-3 transition-colors ${cls}`}
                  >
                    <span className="font-bold shrink-0">{letter})</span>
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>

            {revealed[q.id] && (
              <div className="bg-ink/[0.03] border-l-4 border-gold rounded-r-xl px-4 py-3 mb-4 text-sm text-ink/80 leading-relaxed">
                <strong className={answers[q.id] === q.correctOpt ? "text-green-600" : "text-red-600"}>
                  {answers[q.id] === q.correctOpt ? "Correct! " : "Not quite. "}
                </strong>
                {q.explanation}
              </div>
            )}

            {revealed[q.id] && (
              <button
                onClick={next}
                className="w-full bg-gold text-ink font-semibold py-3 rounded-full hover:bg-gold-dark transition-colors"
              >
                {current < questions.length - 1 || SUBJECTS.indexOf(subject) < SUBJECTS.length - 1 ? "Next Question →" : "See My Score"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default FreeTestSection;
