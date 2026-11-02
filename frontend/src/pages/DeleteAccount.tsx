import { Link } from "react-router-dom";
import { SITE } from "../utils/siteInfo";

// Account deletion page. Google Play requires apps that let people create an
// account to offer a web link where they can ask for the account to be deleted.
const MESSAGE =
  "Hi YNeet, please delete my account and all my data.\nRegistered email: \nRegistered phone: ";

const DeleteAccount = () => (
  <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
    <h1 className="font-display text-3xl font-bold">Delete your YNeet account</h1>
    <p className="mt-4 text-ink/75 leading-relaxed">
      You can ask us to delete your YNeet account at any time, from the website or the Android app.
    </p>

    <ol className="mt-6 list-decimal pl-5 space-y-2 text-ink/80 leading-relaxed">
      <li>Send us a WhatsApp message from the phone number on your account, or include the email you registered with.</li>
      <li>We check that the request comes from the account owner (or the student's parent).</li>
      <li>We delete the account within 7 days and confirm on WhatsApp.</li>
    </ol>

    <a
      href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex items-center justify-center rounded-full bg-ink text-paper font-semibold px-6 py-3 hover:bg-ink/90"
    >
      Request deletion on WhatsApp
    </a>

    <h2 className="font-display text-xl font-bold mt-10">What gets deleted</h2>
    <ul className="mt-2 list-disc pl-5 space-y-1 text-ink/75">
      <li>Your login (name, email, phone, password) on www.yneet.in and the app.</li>
      <li>Your profile, class, parent contact and notification settings.</li>
      <li>All tests, answers, scores, practice history, mistakes and streaks.</li>
    </ul>

    <h2 className="font-display text-xl font-bold mt-8">What we keep</h2>
    <p className="mt-2 text-ink/75 leading-relaxed">
      Records of payments you made (date, plan and amount), for as long as Indian tax law requires. Nothing else.
    </p>

    <p className="mt-8 text-sm text-ink/60">
      See our <Link to="/privacy" className="underline">privacy policy</Link> for more.
    </p>
  </div>
);

export default DeleteAccount;
