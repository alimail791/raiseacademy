import { gamesLink } from "./siteInfo";

// One source of truth for the free-feature links, shared by the header menu and
// the footer, so both always show the same grouping and nothing goes missing.

export type NavItem = { label: string; short?: string; to?: string; href?: string; isNew?: boolean };
export type NavGroup = { title: string; items: NavItem[] };

// Daily / self-test practice
export const PRACTICE: NavGroup = {
  title: "Practice",
  items: [
    { label: "NEET Readiness Test", short: "Readiness Test", to: "/neet-readiness" },
    { label: "Question of the Day", to: "/neet-question-of-the-day" },
    { label: "60-Second Sprint", to: "/neet-sprint" },
    { label: "Chapter-wise PYQs", to: "/neet-practice" },
    { label: "Question papers by year", short: "Past papers", to: "/neet-question-papers" },
    { label: "Daily NEET puzzles", short: "NEET puzzles", href: gamesLink("menu"), isNew: true },
    { label: "Brain Teaser (Class 6–8)", short: "Brain Teaser", to: "/brain-teaser" },
    { label: "Class 6–10 Science MCQs", short: "Class 6–10 MCQs", to: "/class-9-questions" },
  ],
};

// Things to read or watch
export const STUDY: NavGroup = {
  title: "Study material",
  items: [
    { label: "NCERT Biology notes", short: "NCERT notes", to: "/ncert-notes" },
    { label: "Chapter-wise weightage", short: "Weightage", to: "/neet-chapter-wise-weightage" },
    { label: "Concept maps", to: "/neet-concept-maps" },
    { label: "NEET PYQ books (PDF)", short: "PYQ books", to: "/neet-pyq-books" },
    { label: "Daily quiz Shorts", short: "Quiz Shorts", to: "/neet-quiz-shorts" },
    { label: "Ask YNeet: doubts answered", short: "Ask YNeet", to: "/ask-yneet" },
  ],
};

// Exam-process tools
export const TOOLS: NavGroup = {
  title: "NEET 2027 tools",
  items: [
    { label: "College Predictor", to: "/neet-college-predictor" },
    { label: "Cutoff by state", to: "/neet-cutoff" },
    { label: "Score Calculator", to: "/neet-score-calculator" },
    { label: "NEET 2027 exam date", short: "Exam date", to: "/neet-2027-exam-date" },
    { label: "Registration guide", to: "/neet-registration" },
    { label: "Photo & signature resizer", short: "Photo resizer", to: "/neet-photo-resizer" },
  ],
};

export const FREE_GROUPS: NavGroup[] = [PRACTICE, STUDY, TOOLS];
