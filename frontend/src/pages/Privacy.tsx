import { Link } from "react-router-dom";
import { SITE } from "../utils/siteInfo";

// Privacy policy for www.yneet.in, app.yneet.in and the YNeet Android app.
// Google Play requires a public privacy policy URL for every app.
const UPDATED = "2 November 2026";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold">{title}</h2>
    <div className="mt-2 space-y-2 text-ink/75 leading-relaxed">{children}</div>
  </section>
);

const Privacy = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
    <h1 className="font-display text-3xl font-bold">Privacy policy</h1>
    <p className="mt-2 text-sm text-ink/60">Last updated: {UPDATED}</p>
    <p className="mt-6 text-ink/75 leading-relaxed">
      This policy explains what YNeet (run by Raise Academy, Avadi, Chennai) collects when you use www.yneet.in,
      app.yneet.in and the YNeet Android app, why we collect it, and how you can see or delete it.
    </p>

    <Section title="What we collect">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Account details:</strong> student's name, email, phone number, class, board, gender, place and expected NEET year, and a password (stored only as a secure hash).</li>
        <li><strong>Parent contact:</strong> a parent's WhatsApp number or email, if you add one, to send progress reports.</li>
        <li><strong>Study activity:</strong> tests taken, answers, scores, practice history, mistakes saved, streaks and time spent.</li>
        <li><strong>Payments:</strong> plan, amount and payment status. Card, UPI and bank details are handled by Razorpay; we never see or store them.</li>
        <li><strong>Device and usage:</strong> basic analytics (pages visited, device and browser type, approximate location from IP) through Google Analytics and the Meta pixel, and a notification token if you turn on reminders.</li>
      </ul>
    </Section>

    <Section title="How we use it">
      <ul className="list-disc pl-5 space-y-1">
        <li>To run your account, show content for your class, score tests and track your progress.</li>
        <li>To send messages you can expect: Question of the Day and study reminders (WhatsApp, email or app notifications), trial and plan reminders, and weekly reports to the parent contact you gave.</li>
        <li>To process payments and give support.</li>
        <li>To improve YNeet and measure our ads.</li>
      </ul>
      <p>We do not sell your personal data, and we do not show third-party ads.</p>
    </Section>

    <Section title="Who we share it with">
      <p>Only the services we need to run YNeet, and only what each one needs:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Hosting and databases: Railway, Supabase and our cloud database provider.</li>
        <li>Payments: Razorpay.</li>
        <li>Messages: Meta (WhatsApp Business), Resend (email) and Google (app notifications).</li>
        <li>AI explanations: the question you ask to be explained is sent to Anthropic. Your name and contact details are not sent.</li>
        <li>Analytics and ads measurement: Google and Meta (Facebook).</li>
        <li>Your coaching institute, if your account was given to you by one: your name, class and test results.</li>
      </ul>
      <p>We may also share data if the law requires it.</p>
    </Section>

    <Section title="Students under 18">
      <p>
        YNeet is a study tool for school students. A parent or guardian should create the account, or agree to it, for students under 18.
        Parents can ask to see or delete their child's data at any time using the contact below.
      </p>
    </Section>

    <Section title="How long we keep it">
      <p>
        We keep your data while your account is open. If you delete your account, we delete your login and study data within 7 days.
        Payment records are kept as long as Indian tax law requires.
      </p>
    </Section>

    <Section title="Your choices">
      <ul className="list-disc pl-5 space-y-1">
        <li>Turn app notifications on or off in your YNeet profile or your phone's settings.</li>
        <li>Remove the parent contact in your YNeet profile.</li>
        <li>Ask for a copy of your data, a correction, or deletion. <Link to="/delete-account" className="text-rise-dark underline">How to delete your account</Link>.</li>
      </ul>
    </Section>

    <Section title="Security">
      <p>All traffic uses HTTPS, passwords are hashed, and only our team can access student data.</p>
    </Section>

    <Section title="Contact">
      <p>
        Raise Academy, Muthapudupet, Avadi, Chennai, Tamil Nadu. WhatsApp:{" "}
        <a href={`https://wa.me/${SITE.whatsappNumber}`} className="text-rise-dark underline" target="_blank" rel="noopener noreferrer">+{SITE.whatsappNumber}</a>.
        We'll update this page if anything changes and show the new date at the top.
      </p>
    </Section>
  </div>
);

export default Privacy;
