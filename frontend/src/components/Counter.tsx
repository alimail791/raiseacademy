import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const Counter = ({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="font-display text-4xl sm:text-5xl font-bold text-gold">
        {value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-2 text-sm text-paper/70">{label}</div>
    </motion.div>
  );
};

export default Counter;
