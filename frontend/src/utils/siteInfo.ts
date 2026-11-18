// YNeet Daily: free daily NEET puzzle games. `s` tells the games site where the
// player came from, so sign-ups from this website show up separately in its stats.
export const gamesLink = (spot: string) => `https://play.yneet.in/play?s=website_${spot}`;

// YNeet new-tab extension on the Chrome Web Store (source: chrome-extension/ in this repo).
export const CHROME_EXTENSION_URL = "https://chromewebstore.google.com/detail/hghipbkakkaebanhaglpibgomnkkeonm?utm_source=yneet.in";

export const SITE = {
  name: "YNeet",
  logoUrl: "/logo.jpeg",
  // No location/address, phone numbers, or email are shown anywhere on the
  // site. WhatsApp remains the one direct contact channel.
  whatsappNumber: "919443424064",
  whatsappMessage:
    "Hi YNeet, I'd like help clearing a NEET doubt / know more about your plans.",
  // WhatsApp Channel invite link (https://whatsapp.com/channel/...). Empty = the
  // "Get it daily on WhatsApp" buttons stay hidden.
  whatsappChannel: "https://whatsapp.com/channel/0029Va6DPU1JkK7E9QxsrM36",
};
