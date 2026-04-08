import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

const titleLetters = 'Kaizen'.split('');

// Sakura SVG petal shapes
const petals = [
  { cx: 40, cy: 30, rx: 18, ry: 24, rotate: 0 },
  { cx: 40, cy: 30, rx: 18, ry: 24, rotate: 72 },
  { cx: 40, cy: 30, rx: 18, ry: 24, rotate: 144 },
  { cx: 40, cy: 30, rx: 18, ry: 24, rotate: 216 },
  { cx: 40, cy: 30, rx: 18, ry: 24, rotate: 288 },
];

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        onCompleteRef.current();
      }, 600);
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
        >
          {/* Sakura Bloom */}
          <div className="mb-8">
            <SakuraBloom />
          </div>

          {/* Title: letters fade in right-to-left */}
          <div className="flex items-center gap-1 overflow-hidden">
            {titleLetters.map((letter, i) => (
              <motion.span
                key={letter + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  bounce: 0,
                  duration: 0.4,
                  delay: 0.3 + i * 0.1,
                }}
                className="text-4xl md:text-5xl font-medium tracking-tight text-white"
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: 'spring',
              bounce: 0,
              duration: 0.4,
              delay: 1.2,
            }}
            className="text-white/40 font-mono text-sm mt-3"
          >
            Minimalist To-Do System
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SakuraBloom() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.8, delay: 0.1 }}
      className="w-16 h-16 md:w-20 md:h-20 relative"
    >
      {/* Center circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.6, delay: 0.5 }}
        className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div className="w-3 h-3 rounded-full bg-red-600" />
      </motion.div>

      {/* Petals blooming outward */}
      {petals.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 80 80"
          className="absolute inset-0 w-full h-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            bounce: 0.15,
            duration: 0.6,
            delay: 0.2 + i * 0.08,
          }}
          style={{ transformOrigin: 'center center' }}
        >
          <ellipse
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            fill="#dc2626"
            opacity={0.85}
            transform={`rotate(${p.rotate} 40 40)`}
          />
        </motion.svg>
      ))}
    </motion.div>
  );
}
