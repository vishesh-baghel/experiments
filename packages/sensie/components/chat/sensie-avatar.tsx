'use client';

import { motion } from 'framer-motion';

/**
 * SensieAvatar - Wise master avatar for Sensie messages
 *
 * A stylized silhouette of a wise martial arts master
 * with subtle ki energy glow when active
 */

interface SensieAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  className?: string;
}

export function SensieAvatar({
  size = 'md',
  isThinking = false,
  className = '',
}: SensieAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <motion.div
      className={`relative flex-shrink-0 ${sizeClasses[size]} ${className}`}
      animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(38,92%,50%)]"
        animate={
          isThinking
            ? {
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.15, 1],
              }
            : { opacity: 0.2 }
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ filter: 'blur(8px)' }}
      />

      {/* Main avatar circle */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[hsl(38,40%,90%)] to-[hsl(35,30%,85%)] border-2 border-[hsl(25,95%,53%)/0.3] overflow-hidden shadow-lg">
        {/* Wise master silhouette SVG */}
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background texture circle */}
          <circle cx="20" cy="20" r="18" fill="hsl(35, 25%, 92%)" />

          {/* Stylized sensei silhouette - bald head with beard */}
          <ellipse
            cx="20"
            cy="14"
            rx="8"
            ry="9"
            fill="hsl(20, 14%, 25%)"
          />

          {/* Sunglasses (iconic Roshi element) */}
          <path
            d="M12 13 Q14 11 16 13 L16 15 Q14 16 12 15 Z"
            fill="hsl(20, 10%, 15%)"
          />
          <path
            d="M24 13 Q26 11 28 13 L28 15 Q26 16 24 15 Z"
            fill="hsl(20, 10%, 15%)"
          />
          <line
            x1="16"
            y1="14"
            x2="24"
            y2="14"
            stroke="hsl(20, 10%, 15%)"
            strokeWidth="1"
          />

          {/* Beard */}
          <path
            d="M14 18 Q20 28 26 18 Q24 24 20 26 Q16 24 14 18"
            fill="hsl(0, 0%, 85%)"
          />

          {/* Body/shoulders hint */}
          <path
            d="M8 38 Q12 28 20 28 Q28 28 32 38"
            fill="hsl(25, 95%, 45%)"
          />

          {/* Subtle highlight */}
          <circle
            cx="16"
            cy="11"
            r="2"
            fill="hsl(35, 30%, 96%)"
            opacity="0.4"
          />
        </svg>

        {/* Ki energy particles when thinking */}
        {isThinking && (
          <>
            <motion.div
              className="absolute w-1.5 h-1.5 rounded-full bg-[hsl(38,92%,50%)]"
              animate={{
                x: [0, 10, -5, 0],
                y: [0, -8, -12, 0],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              style={{ top: '50%', left: '30%' }}
            />
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-[hsl(25,95%,53%)]"
              animate={{
                x: [0, -8, 5, 0],
                y: [0, -10, -8, 0],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              style={{ top: '45%', left: '60%' }}
            />
            <motion.div
              className="absolute w-1 h-1 rounded-full bg-[hsl(30,100%,60%)]"
              animate={{
                x: [0, 5, -10, 0],
                y: [0, -12, -6, 0],
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              style={{ top: '55%', left: '45%' }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}

export default SensieAvatar;
