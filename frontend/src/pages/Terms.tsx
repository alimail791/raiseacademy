import { Link } from "react-router-dom";
import { SITE } from "../utils/siteInfo";

// Terms of Service for www.yneet.in, app.yneet.in and the YNeet Android app.
// Linked from the footer, the sign-up form and the Google Play listing.
const UPDATED = "6 November 2026";

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="font-display text-xl font-bold">{n}. {title}</h2>
    <div className="mt-2 space-y-2 text-ink/75 leading-relaxed">{children}</div>
  </section>
);

const A = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-rise-dark underline" target="_blank" rel="noopener noreferrer">{children}</a>
);

const Terms = () => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
    <h1 className="font-display text-3xl font-bold">Terms of Service</h1>
    <p className="mt-2 text-sm text-ink/70">Last updated: {UPDATED}</p>
    <p className="mt-6 text-ink/75 leading-relaxed">
      These terms apply when you use YNeet at www.yneet.in, app.yneet.in or the YNeet Android app. YNeet is run by
      Raise Academy, Muthapudupet, Avadi, Chennai, Tamil Nadu ("we", "us"). By creating an account or using YNeet you
      agree to these terms and to our <Link to="/privacy" className="text-rise-dark underline">Privacy policy</Link>.
    </p>

    <Section n={1} title="Your account">
      <ul className="list-disc pl-5 space-y-1">
        <li>Give correct details when you sign up, and keep your password private.</li>
        <li>One account is for one student. Don't share your login or let others use your plan. We may pause accounts that are clearly shared.</li>
        <li>If you are under 18, a parent or guardian must agree to your use of YNeet and to these terms.</li>
        <li>You are responsible for what happens in your account. Tell us on WhatsApp straight away if you think someone else has used it.</li>
      </ul>
    </Section>

    <Section n={2} title="Free access, trials and plans">
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Class 6–8 (YNeet Junior)</strong> is free.</li>
        <li><strong>Class 9 onwards</strong> gets a free 30-day trial when you register. No card or payment is needed for the trial.</li>
        <li>After the trial you can buy a 1-month, 6-month or 12-month plan. Current prices are on the <Link to="/courses" className="text-rise-dark underline">Courses page</Link>.</li>
        <li>Plans are <strong>one-time payments</strong>. Nothing renews or charges you automatically. When a plan ends, paid features stop until you buy again.</li>
        <li>Payments are taken on our website through Razorpay. The Android app does not sell plans.</li>
        <li>If we change prices, the new price applies only to plans bought after the change.</li>
        <li>Refunds follow our <A href="https://pay.yneet.in/refund">Refund policy</A>.</li>
      </ul>
    </Section>

    <Section n={3} title="Referral rewards">
      <p>
        Refer & Earn gives you free study days when friends join and qualify, as described in the app. Free days have no cash
        value and can't be exchanged or transferred. We may remove rewards earned through fake accounts or other misuse.
      </p>
    </Section>

    <Section n={4} title="Using YNeet fairly">
      <p>Please don't:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>copy, sell, publish or share our questions, tests, explanations, notes or videos outside YNeet;</li>
        <li>use bots, scripts or scraping tools, or try to get around limits, logins or payments;</li>
        <li>upload anything unlawful, abusive, sexual or unrelated to study when you ask a doubt;</li>
        <li>pretend to be someone else, or use YNeet to harm, harass or mislead others.</li>
      </ul>
      <p>We may remove content, pause or close accounts that break these rules.</p>
    </Section>

    <Section n={5} title="Our content">
      <p>
        Questions, tests, explanations, concept maps, notes, videos, the YNeet name and logo belong to Raise Academy or to
        the people who licensed them to us. You may use them for your own study. Previous-year NEET questions are
        included for practice; YNeet is not connected to or endorsed by the National Testing Agency (NTA).
      </p>
    </Section>

    <Section n={6} title="Doubts and other things you send us">
      <p>
        When you ask a doubt or send an image, you let us use it to answer you. We may also show selected questions and our
        answers to other students (for example in Ask YNeet) without your name or contact details. Only send what you have
        the right to share.
      </p>
    </Section>

    <Section n={7} title="AI explanations">
      <p>
        Some explanations and answers are written with the help of AI and checked by our team where possible. They can
        still contain mistakes. Use them as study help, and check important points against your NCERT textbook or a
        teacher. Your NCERT books and official NTA notices come first.
      </p>
    </Section>

    <Section n={8} title="Creators">
      <p>
        Teachers and creators who make videos for YNeet also agree to the{" "}
        <A href="https://app.yneet.in/creator/terms">Creator Terms</A>, which cover content rights and payments.
      </p>
    </Section>

    <Section n={9} title="No guarantee of results">
      <p>
        YNeet helps you prepare, but we can't promise any NEET score, rank, cutoff or admission. Your result depends on your
        own preparation and on the exam.
      </p>
    </Section>

    <Section n={10} title="Messages from us">
      <p>
        We send study reminders, Question of the Day, plan reminders and progress reports by WhatsApp, email or app
        notification. You can turn app notifications off in your profile or phone settings, or ask us on WhatsApp to stop
        other messages.
      </p>
    </Section>

    <Section n={11} title="Service availability and changes">
      <p>
        We work to keep YNeet running, but it may sometimes be slow or unavailable, for example during updates. We may add,
        change or remove features. If we stop a paid feature you have already paid for, we'll offer a fair replacement or a
        part-refund for the unused time.
      </p>
    </Section>

    <Section n={12} title="Closing your account">
      <p>
        You can close your account at any time: see <Link to="/delete-account" className="text-rise-dark underline">Delete my account</Link>.
        We may close accounts that seriously or repeatedly break these terms. Closing an account does not by itself give a
        refund, except as the Refund policy says.
      </p>
    </Section>

    <Section n={13} title="Limit of our responsibility">
      <p>
        YNeet is provided "as is". As far as the law allows, we are not responsible for indirect losses, and our total
        responsibility to you for any claim is limited to the amount you paid us in the 12 months before it. Nothing here
        limits rights you have under Indian consumer law.
      </p>
    </Section>

    <Section n={14} title="Law and disputes">
      <p>
        These terms are governed by the laws of India. Please contact us first so we can try to sort out any problem.
        If we can't, the courts in Chennai, Tamil Nadu will have jurisdiction.
      </p>
    </Section>

    <Section n={15} title="Changes to these terms">
      <p>
        We may update these terms. We'll show the new date at the top of this page, and tell you in YNeet or by message if
        a change is important. Using YNeet after a change means you accept the updated terms.
      </p>
    </Section>

    <Section n={16} title="Contact">
      <p>
        Raise Academy, Muthapudupet, Avadi, Chennai, Tamil Nadu. Email:{" "}
        <a href="mailto:info@raiseacademy.in" className="text-rise-dark underline">info@raiseacademy.in</a>. WhatsApp:{" "}
        <A href={`https://wa.me/${SITE.whatsappNumber}`}>+{SITE.whatsappNumber}</A>.
      </p>
    </Section>
  </div>
);

export default Terms;
