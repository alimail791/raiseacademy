import { useState } from "react";
import { MessageCircle, ChevronDown } from "lucide-react";
import { SITE } from "../utils/siteInfo";

const FAQS = [
  {
    q: "How do I enroll?",
    a: "Click 'Enroll Now' at the top of the site, fill in your details, and register. You'll be taken straight into YNeet to pick a plan once you're signed up.",
  },
  {
    q: "What courses do you offer?",
    a: "NEET Foundation (Classes 6-10) for early foundation building, and NEET Coaching (Classes 11, 12, or Dropper/Repeater) for full exam-intensity prep. See the Courses page for details.",
  },
  {
    q: "What is YNeet?",
    a: "YNeet is our NEET prep platform — mock tests, daily quizzes, a practice question bank, a mistake notebook, flashcards, and formula sheets, all scoped to your exact class syllabus. It's included once you register here.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — try the free 30-question sample test right on this page (scroll up, or tap 'Take a Free Mock Test'), no registration needed. Once registered, YNeet also offers a 5-day full-access trial plan.",
  },
  {
    q: "How much does YNeet cost?",
    a: "A 5-Day trial plan and a Monthly plan are both available from the Pricing page inside YNeet after you register — pricing is shown there in full before you pay anything.",
  },
  {
    q: "I forgot my password",
    a: "On the Login page, click 'Forgot password?' and follow the steps — a code is emailed to you to reset it.",
  },
  {
    q: "How do I contact you?",
    a: "WhatsApp is the fastest way to reach us — tap the button below.",
  },
];

export default function Help() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="uppercase tracking-widest text-gold text-sm font-semibold mb-2">Help</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-ink/60">Can't find what you need? Message us directly below.</p>
      </div>

      <div className="bg-rise-line text-paper rounded-2xl p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-semibold">Still have a question?</p>
          <p className="text-paper/70 text-sm">We usually reply quickly on WhatsApp.</p>
        </div>
        <a
          href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gold text-ink font-semibold px-5 py-2.5 rounded-full hover:bg-gold-dark transition-colors whitespace-nowrap"
        >
          <MessageCircle size={18} /> Chat on WhatsApp
        </a>
      </div>

      <div className="space-y-3">
        {FAQS.map((item, i) => {
          const open = openIdx === i;
          return (
            <div key={i} className="border border-ink/10 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full text-left px-5 py-4 flex justify-between items-center gap-4"
              >
                <span className="font-medium text-ink">{item.q}</span>
                <ChevronDown size={18} className={`text-ink/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="px-5 pb-4 text-ink/70 text-sm leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
