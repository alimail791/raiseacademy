import { Suspense, useEffect, useState } from "react";
import { page } from "./lazyPage";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { isAppMode, isFramed } from "./utils/appMode";
import Navbar from "./components/layout/Navbar";
import TrialBar from "./components/layout/TrialBar";
import Footer from "./components/layout/Footer";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import usePageMeta from "./usePageMeta";

import Home from "./pages/Home";
const About = page(() => import("./pages/About"));
const Courses = page(() => import("./pages/Courses"));
const Help = page(() => import("./pages/Help"));
const NeetTrial = page(() => import("./pages/NeetTrial"));
const Institutes = page(() => import("./pages/Institutes"));
const Blog = page(() => import("./pages/Blog"));
const BlogPost = page(() => import("./pages/BlogPost"));

const Login = page(() => import("./pages/Login"));
const Register = page(() => import("./pages/Register"));
const ForgotPassword = page(() => import("./pages/ForgotPassword"));
const Dashboard = page(() => import("./pages/Dashboard"));
import NotFound from "./pages/NotFound";
const Practice = page(() => import("./pages/Practice"));
const PracticeChapter = page(() => import("./pages/PracticeChapter"));
const QuestionPage = page(() => import("./pages/QuestionPage"));
const SchoolHub = page(() => import("./pages/SchoolHub"));
const NeetWeightage = page(() => import("./pages/NeetWeightage"));
const NeetMostMissed = page(() => import("./pages/NeetMostMissed"));
const PyqBooks = page(() => import("./pages/PyqBooks"));
const NeetQuizShorts = page(() => import("./pages/NeetQuizShorts"));
const NeetCutoffIndex = page(() => import("./pages/NeetCutoff"), "NeetCutoffIndex");
const NeetCutoffState = page(() => import("./pages/NeetCutoff"), "NeetCutoffState");
const RegionalCutoffIndex = page(() => import("./pages/RegionalPages"), "RegionalCutoffIndex");
const RegionalCutoffState = page(() => import("./pages/RegionalPages"), "RegionalCutoffState");
const RegionalWeightage = page(() => import("./pages/RegionalPages"), "RegionalWeightage");
import { LANGS } from "./i18n/langs";
const NeetReadiness = page(() => import("./pages/NeetReadiness"));
const NeetCollegePredictor = page(() => import("./pages/NeetCollegePredictor"));
const NeetCollegeReport = page(() => import("./pages/NeetCollegeReport"));
const AdminPredictor = page(() => import("./pages/admin/AdminPredictor"));
const NeetParents = page(() => import("./pages/NeetParents"));
const PapersIndex = page(() => import("./pages/Papers"), "PapersIndex");
const PaperYear = page(() => import("./pages/Papers"), "PaperYear");
const QuestionOfTheDay = page(() => import("./pages/QuestionOfTheDay"));
const NeetExamDate = page(() => import("./pages/NeetExamDate"));
const NeetRegistration = page(() => import("./pages/NeetRegistration"));
const NeetPhotoResizer = page(() => import("./pages/NeetPhotoResizer"));
const NeetScoreCalculator = page(() => import("./pages/NeetScoreCalculator"));
const NcertIndex = page(() => import("./pages/NcertNotes"), "NcertIndex");
const NcertChapter = page(() => import("./pages/NcertNotes"), "NcertChapter");
const QotdEmbed = page(() => import("./pages/QotdEmbed"));
const PredictorEmbed = page(() => import("./pages/WidgetEmbeds"), "PredictorEmbed");
const CutoffEmbed = page(() => import("./pages/WidgetEmbeds"), "CutoffEmbed");
const QotdWidget = page(() => import("./pages/QotdWidget"));
const Privacy = page(() => import("./pages/Privacy"));
const Terms = page(() => import("./pages/Terms"));
const BrainTeaser = page(() => import("./pages/BrainTeaser"));
const AskYneet = page(() => import("./pages/AskYneet"));
const ConceptMaps = page(() => import("./pages/ConceptMaps"));
const NeetSprint = page(() => import("./pages/NeetSprint"));
const NeetShorts = page(() => import("./pages/NeetShorts"));
import { AppPriceGuard, AppLeave } from "./components/AppPriceGuard";
const Logout = page(() => import("./pages/Logout"));
const DeleteAccount = page(() => import("./pages/DeleteAccount"));

const AdminLayout = page(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = page(() => import("./pages/admin/AdminDashboard"));
const AdminStudents = page(() => import("./pages/admin/AdminStudents"));
const AdminInstitutes = page(() => import("./pages/admin/AdminInstitutes"));
const AdminBlog = page(() => import("./pages/admin/AdminBlog"));
const InstituteLogin = page(() => import("./pages/institute/InstituteLogin"));
const InstitutePanel = page(() => import("./pages/institute/InstitutePanel"));
const InstituteForgot = page(() => import("./pages/institute/InstituteForgot"));

function App() {
  usePageMeta();
  const { pathname } = useLocation();
  // Inside the Android app: only login / sign-up, no menu, footer or prices.
  // Decided after the first render so the prerendered HTML still hydrates cleanly.
  const [appMode, setAppMode] = useState(false);
  useEffect(() => { setAppMode(isAppMode()); }, []);
  // Boxes other websites show in an <iframe>: no header, footer or chat button.
  if (pathname.startsWith("/embed/")) {
    return (
      <Suspense fallback={<div className="min-h-[60vh]" />}>
<Routes>
        <Route path="/embed/qotd" element={<QotdEmbed />} />
        <Route path="/embed/predictor" element={<PredictorEmbed />} />
        <Route path="/embed/cutoff" element={<CutoffEmbed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
</Suspense>
    );
  }
  if (appMode) {
    // Inside the Android app (Play Store). Login / sign-up pages, plus every free
    // study page for the app's Explore screen. No site menu, footer, prices or
    // payment links (Play "consumption only"); AppPriceGuard hides any price text.
    // In the app's frame (app.yneet.in), the app draws its own top bar.
    const framed = isFramed();
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <AppPriceGuard />
        {!framed && <header className="py-5 text-center font-display text-2xl font-bold">YNeet</header>}
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
<Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/neet-readiness" element={<NeetReadiness />} />
            <Route path="/neet-college-predictor" element={<NeetCollegePredictor />} />
          <Route path="/neet-cutoff" element={<NeetCutoffIndex />} />
          <Route path="/neet-cutoff/:state" element={<NeetCutoffState />} />
          {LANGS.map((l) => [
            <Route key={`${l}c`} path={`/${l}/neet-cutoff`} element={<RegionalCutoffIndex key={l} lang={l} />} />,
            <Route key={`${l}s`} path={`/${l}/neet-cutoff/:state`} element={<RegionalCutoffState key={l} lang={l} />} />,
            <Route key={`${l}w`} path={`/${l}/neet-chapter-wise-weightage`} element={<RegionalWeightage key={l} lang={l} />} />,
          ])}
            <Route path="/neet-registration" element={<NeetRegistration />} />
            <Route path="/neet-photo-resizer" element={<NeetPhotoResizer />} />
            <Route path="/neet-score-calculator" element={<NeetScoreCalculator />} />
            <Route path="/neet-college-predictor/report" element={<NeetCollegeReport />} />
            <Route path="/neet-sprint" element={<NeetSprint />} />
            <Route path="/neet-question-of-the-day" element={<QuestionOfTheDay />} />
            <Route path="/neet-practice" element={<Practice />} />
            <Route path="/neet-chapter-wise-weightage" element={<NeetWeightage />} />
            <Route path="/neet-most-missed-chapters" element={<NeetMostMissed />} />
            <Route path="/neet-pyq-books" element={<PyqBooks />} />
            <Route path="/neet-quiz-shorts" element={<NeetQuizShorts />} />
            <Route path="/neet-practice/:subject/:chapter" element={<PracticeChapter />} />
            <Route path="/neet-question/:slug" element={<QuestionPage />} />
            {[6, 7, 8, 9, 10].map((n) => [
              <Route key={`h${n}`} path={`/class-${n}-questions`} element={<SchoolHub classNum={n} />} />,
              <Route key={`q${n}`} path={`/class-${n}-questions/:slug`} element={<QuestionPage classNum={n} />} />,
            ])}
            <Route path="/neet-question-papers" element={<PapersIndex />} />
            <Route path="/neet-question-papers/:year" element={<PaperYear />} />
          <Route path="/neet-question-papers/:year/:subject" element={<PaperYear />} />
            <Route path="/neet-concept-maps" element={<ConceptMaps />} />
            <Route path="/ncert-notes" element={<NcertIndex />} />
            <Route path="/ncert-notes/:slug" element={<NcertChapter />} />
            <Route path="/neet-shorts" element={<NeetShorts />} />
            <Route path="/ask-yneet" element={<AskYneet />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/brain-teaser" element={<BrainTeaser />} />
            <Route path="/neet-2027-exam-date" element={<NeetExamDate />} />
            <Route path="/neet-trial" element={<NeetTrial />} />
            <Route path="/neet-parents" element={<NeetParents />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<AppLeave />} />
          </Routes>
</Suspense>
        </main>
        <WhatsAppButton />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <TrialBar />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh]" />}>
<Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/neet-trial" element={<NeetTrial />} />
          <Route path="/institutes" element={<Institutes />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/neet-readiness" element={<NeetReadiness />} />
          <Route path="/neet-college-predictor" element={<NeetCollegePredictor />} />
          <Route path="/neet-cutoff" element={<NeetCutoffIndex />} />
          <Route path="/neet-cutoff/:state" element={<NeetCutoffState />} />
          {LANGS.map((l) => [
            <Route key={`${l}c`} path={`/${l}/neet-cutoff`} element={<RegionalCutoffIndex key={l} lang={l} />} />,
            <Route key={`${l}s`} path={`/${l}/neet-cutoff/:state`} element={<RegionalCutoffState key={l} lang={l} />} />,
            <Route key={`${l}w`} path={`/${l}/neet-chapter-wise-weightage`} element={<RegionalWeightage key={l} lang={l} />} />,
          ])}
          <Route path="/neet-college-predictor/report" element={<NeetCollegeReport />} />
          <Route path="/neet-parents" element={<NeetParents />} />
          <Route path="/neet-question-papers" element={<PapersIndex />} />
          <Route path="/neet-question-papers/:year" element={<PaperYear />} />
          <Route path="/neet-question-papers/:year/:subject" element={<PaperYear />} />
          <Route path="/neet-question-of-the-day" element={<QuestionOfTheDay />} />
          <Route path="/brain-teaser" element={<BrainTeaser />} />
          <Route path="/ask-yneet" element={<AskYneet />} />
          <Route path="/neet-concept-maps" element={<ConceptMaps />} />
          <Route path="/neet-sprint" element={<NeetSprint />} />
          <Route path="/neet-shorts" element={<NeetShorts />} />
          <Route path="/neet-2027-exam-date" element={<NeetExamDate />} />
          <Route path="/neet-registration" element={<NeetRegistration />} />
          <Route path="/neet-photo-resizer" element={<NeetPhotoResizer />} />
          <Route path="/neet-score-calculator" element={<NeetScoreCalculator />} />
          <Route path="/neet-question-widget" element={<QotdWidget />} />
          <Route path="/ncert-notes" element={<NcertIndex />} />
          <Route path="/ncert-notes/:slug" element={<NcertChapter />} />
          <Route path="/neet-practice" element={<Practice />} />
            <Route path="/neet-chapter-wise-weightage" element={<NeetWeightage />} />
            <Route path="/neet-most-missed-chapters" element={<NeetMostMissed />} />
            <Route path="/neet-pyq-books" element={<PyqBooks />} />
            <Route path="/neet-quiz-shorts" element={<NeetQuizShorts />} />
          <Route path="/neet-practice/:subject/:chapter" element={<PracticeChapter />} />
          <Route path="/neet-question/:slug" element={<QuestionPage />} />
            {[6, 7, 8, 9, 10].map((n) => [
              <Route key={`h${n}`} path={`/class-${n}-questions`} element={<SchoolHub classNum={n} />} />,
              <Route key={`q${n}`} path={`/class-${n}-questions/:slug`} element={<QuestionPage classNum={n} />} />,
            ])}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="institutes" element={<AdminInstitutes />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="predictor" element={<AdminPredictor />} />
          </Route>

          <Route path="/institute/login" element={<InstituteLogin />} />
          <Route path="/institute/forgot" element={<InstituteForgot />} />
          <Route path="/institute" element={<InstitutePanel />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
</Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;
