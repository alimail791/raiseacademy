// YNeet Daily: free daily NEET puzzle games. `s` tells the games site where the
// player came from, so sign-ups from this website show up separately in its stats.
export const gamesLink = (spot: string) => `https://play.yneet.in/play?s=website_${spot}`;

export const SITE = {
  name: "YNeet",
  logoUrl: "/logo.jpeg",
  // No location/address, phone numbers, or email are shown anywhere on the
  // site. WhatsApp remains the one direct contact channel.
  whatsappNumber: "919443424064",
  whatsappMessage:
    "Hi YNeet, I'd like help clearing a NEET doubt / know more about your plans.",
};
