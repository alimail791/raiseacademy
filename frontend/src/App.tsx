import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { isAppMode, APP_MODE_PATHS } from "./utils/appMode";
import Navbar from "./components/layout/Navbar";
import TrialBar from "./components/layout/TrialBar";
import Footer from "./components/layout/Footer";
import WhatsAppButton from "./components/layout/WhatsAppButton";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import usePageMeta from "./usePageMeta";

import Home from "./pages/Home";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Help from "./pages/Help";
import NeetTrial from "./pages/NeetTrial";
import Institutes from "./pages/Institutes";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Practice from "./pages/Practice";
import PracticeChapter from "./pages/PracticeChapter";
import NeetReadiness from "./pages/NeetReadiness";
import NeetParents from "./pages/NeetParents";
import { PapersIndex, PaperYear } from "./pages/Papers";
import QuestionOfTheDay from "./pages/QuestionOfTheDay";
import NeetExamDate from "./pages/NeetExamDate";
import { NcertIndex, NcertChapter } from "./pages/NcertNotes";
import QotdEmbed from "./pages/QotdEmbed";
import QotdWidget from "./pages/QotdWidget";
import Privacy from "./pages/Privacy";
import BrainTeaser from "./pages/BrainTeaser";
import AskYneet from "./pages/AskYneet";
import ConceptMaps from "./pages/ConceptMaps";
import NeetSprint from "./pages/NeetSprint";
import DeleteAccount from "./pages/DeleteAccount";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminInstitutes from "./pages/admin/AdminInstitutes";
import AdminBlog from "./pages/admin/AdminBlog";
import InstituteLogin from "./pages/institute/InstituteLogin";
import InstitutePanel from "./pages/institute/InstitutePanel";
import InstituteForgot from "./pages/institute/InstituteForgot";

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
      <Routes>
        <Route path="/embed/qotd" element={<QotdEmbed />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }
  if (appMode) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <header className="py-5 text-center font-display text-2xl font-bold">YNeet</header>
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="*" element={<Navigate to={APP_MODE_PATHS.includes(pathname) ? pathname : "/login"} replace />} />
          </Routes>
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/neet-trial" element={<NeetTrial />} />
          <Route path="/institutes" element={<Institutes />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/neet-readiness" element={<NeetReadiness />} />
          <Route path="/neet-parents" element={<NeetParents />} />
          <Route path="/neet-question-papers" element={<PapersIndex />} />
          <Route path="/neet-question-papers/:year" element={<PaperYear />} />
          <Route path="/neet-question-of-the-day" element={<QuestionOfTheDay />} />
          <Route path="/brain-teaser" element={<BrainTeaser />} />
          <Route path="/ask-yneet" element={<AskYneet />} />
          <Route path="/neet-concept-maps" element={<ConceptMaps />} />
          <Route path="/neet-sprint" element={<NeetSprint />} />
          <Route path="/neet-2027-exam-date" element={<NeetExamDate />} />
          <Route path="/neet-question-widget" element={<QotdWidget />} />
          <Route path="/ncert-notes" element={<NcertIndex />} />
          <Route path="/ncert-notes/:slug" element={<NcertChapter />} />
          <Route path="/neet-practice" element={<Practice />} />
          <Route path="/neet-practice/:subject/:chapter" element={<PracticeChapter />} />

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
          </Route>

          <Route path="/institute/login" element={<InstituteLogin />} />
          <Route path="/institute/forgot" element={<InstituteForgot />} />
          <Route path="/institute" element={<InstitutePanel />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default App;
