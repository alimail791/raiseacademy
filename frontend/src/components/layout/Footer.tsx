import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { SITE } from "../../utils/siteInfo";

const Footer = () => {
  return (
    <footer className="bg-ink text-paper/80 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <img src={SITE.logoUrl} alt={SITE.name} className="h-9 w-9 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg text-paper">{SITE.name}</span>
          </div>
          <p className="text-sm leading-relaxed">
            NEET preparation built around your class syllabus — mock tests, daily quizzes,
            practice questions, flashcards, and formula sheets, all in one place.
          </p>
        </div>

        <div>
          <h4 className="font-display font-semibold text-paper mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/courses" className="hover:text-gold">Courses</Link></li>
            <li><Link to="/register" className="hover:text-gold">Enroll Now</Link></li>
            <li>
              <a
                href="https://testmandi.in/tests/premium_neet_1/neet-complete-practice-test-biology-physics-chemistry"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                TestMandi — NEET Practice Tests
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-paper mb-3">Contact</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <MessageCircle size={16} className="text-gold" />
              <a
                href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                Talk on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10 py-5 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
