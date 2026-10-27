import { normalizePhone, waConfigured } from "./parentWhatsApp.js";

// Sends a one-time code on WhatsApp using an approved Meta AUTHENTICATION
// template (body: "<code> is your verification code…" + a "Copy code" button).
// Uses the same WA_TOKEN / WA_PHONE_ID_SHARED as the parent reports.
//   WA_OTP_TEMPLATE – template name (default: yneet_otp)
//   WA_OTP_LANG     – template language code (default: en)
//   WA_OTP_BUTTON   – "0" if the template has no Copy-code button (auto-detected otherwise)
const phoneId = () => process.env.WA_PHONE_NUMBER_ID || process.env.WA_PHONE_ID_SHARED;

export async function sendWhatsAppOtp(phone, code) {
  if (!waConfigured()) throw new Error("WhatsApp is not configured");
  const phone10 = normalizePhone(phone);
  if (!phone10) throw new Error("Enter a valid 10-digit Indian mobile number");
  if (!/^\d{4,8}$/.test(String(code))) throw new Error("bad code");
  const body = (withButton) => ({
    messaging_product: "whatsapp",
    to: `91${phone10}`,
    type: "template",
    template: {
      name: process.env.WA_OTP_TEMPLATE || "yneet_otp",
      language: { code: process.env.WA_OTP_LANG || "en" },
      components: [
        { type: "body", parameters: [{ type: "text", text: String(code) }] },
        ...(withButton ? [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: String(code) }] }] : []),
      ],
    },
  });
  const post = async (withButton) => {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId()}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(body(withButton)),
      signal: AbortSignal.timeout(15000),
    });
    return { res, data: await res.json().catch(() => ({})) };
  };
  // Authentication templates have a "Copy code" button that needs the code too;
  // a plain text template (body only) rejects that, so retry without the button.
  const withButton = process.env.WA_OTP_BUTTON !== "0";
  let { res, data } = await post(withButton);
  if (!res.ok && withButton && /button|parameter|132000|132012/i.test(JSON.stringify(data?.error || {}))) {
    ({ res, data } = await post(false));
  }
  if (!res.ok) {
    const e = data?.error || {};
    const details = e.error_data?.details ? ` — ${e.error_data.details}` : "";
    throw new Error(`${e.message || `WhatsApp API ${res.status}`}${details}${e.code ? ` [code ${e.code}]` : ""}`);
  }
  return data;
}
