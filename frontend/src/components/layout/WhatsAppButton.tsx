import { MessageCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SITE } from "../../utils/siteInfo";

const WhatsAppButton = () => {
  // Hidden on the sign-up page: on phones it covered the form's fields.
  if (useLocation().pathname.startsWith("/register")) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(SITE.whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle size={26} />
      </a>
    </div>
  );
};

export default WhatsAppButton;
