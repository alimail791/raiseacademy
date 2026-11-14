// Plain number, no entrance animation: the prerendered HTML shows the real
// figure straight away (the old framer-motion version shipped "0" at opacity 0
// until the JavaScript loaded).
const Counter = ({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) => (
  <div className="text-center">
    <div className="font-display text-4xl sm:text-5xl font-bold text-gold">
      {to.toLocaleString("en-IN")}
      {suffix}
    </div>
    <div className="mt-2 text-sm text-paper/70">{label}</div>
  </div>
);

export default Counter;
