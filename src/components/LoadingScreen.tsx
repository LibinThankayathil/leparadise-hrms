'use client';

import { motion } from 'framer-motion';

/**
 * Animated bird/aeroplane emblem taken directly from the Le Paradise logo (`le-Logo.svg`).
 * Elegant gliding and wing-tilt animation with gentle airflow particles.
 */
export function BrandBirdEmblem({ size = 80, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size * 0.65 }}>
      {/* Airflow / Flight glide trails */}
      <motion.div
        className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-[2px] rounded-full bg-gradient-to-r from-transparent to-[#2D7A58]/30"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: [0, 0.7, 0], x: [-12, -4, 4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.1 }}
      />
      <motion.div
        className="absolute -left-4 top-[65%] w-6 h-[1.5px] rounded-full bg-gradient-to-r from-transparent to-[#2D7A58]/20"
        initial={{ opacity: 0, x: 0 }}
        animate={{ opacity: [0, 0.6, 0], x: [-8, -2, 6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
      />

      {/* Glowing aura */}
      <motion.div
        className="absolute inset-0 bg-[#2D7A58]/10 rounded-full blur-xl"
        animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bird Emblem SVG */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        initial={{ y: 0, rotate: 0 }}
        animate={{
          y: [-4, 4, -4],
          rotate: [-1.5, 1.5, -1.5],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          viewBox="0 0 85 55"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm text-[#2D7A58]"
        >
          {/* Exact bird / aeroplane flight motif from le-Logo.svg */}
          <motion.path
            d="M71.1,44.6c-3.6-0.1-6.4-0.7-8.1-1.1c-2.6-0.7-5.4-1.6-8.3-2.7c-13-4.8-19.4-2.9-18.8-3.5c2.1-2,5.7-6.2,9-12.9 c1.3-2.7,3.1-8.5,12.3-8.6c0,0-2.1,7.7-6.9,9.8c-2.9,1.3-5.1,1-6.5,4.1c0,0,1.2-0.2,3.5-0.3c2.3-0.1,11.8,0.8,15.5-8.5 c3.7-9.3,7.6-14.4,7.6-14.4c-9.9,2.2-20.5-0.6-26.5,2.2c-6.3,3-10.5,11.8-13.7,17.2c-3.3,5.4-8,9.9-11,10.3c-3.1,0.4-6.6,1.1-10,3.5 c-2.5,1.8-5.3,3.5-6.6,4.3c-0.4,0.3-0.4,0.3,0.1,0.2c5.3-1.2,7.7-0.8,15.1,0.9c8.3,2,12.6,5.3,29.2,3.3C62.1,46,80,46.6,80,46.6 C77.4,45.2,77,44.8,71.1,44.6z"
            fill="currentColor"
            initial={{ pathLength: 0.8, opacity: 0.95 }}
            animate={{
              opacity: [0.9, 1, 0.9],
              filter: [
                'drop-shadow(0px 2px 4px rgba(45,122,88,0.25))',
                'drop-shadow(0px 4px 8px rgba(45,122,88,0.4))',
                'drop-shadow(0px 2px 4px rgba(45,122,88,0.25))',
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * Fullscreen loading screen for page transitions and initial auth loads.
 */
export function LoadingScreen({ message = 'Loading Le Paradise HRMS...' }: { message?: string }) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center font-sans select-none px-4">
      <div className="flex flex-col items-center text-center">
        {/* Animated Flying Emblem */}
        <BrandBirdEmblem size={96} />

        {/* Brand identity */}
        <motion.div
          className="mt-6 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-base font-bold text-[#181D27] tracking-tight">Le Paradise</span>
          <span className="text-[10px] font-semibold text-slate-400">™</span>
        </motion.div>

        {/* Animated flight progression dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#2D7A58]"
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.25, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <motion.p
          className="mt-3 text-xs font-medium text-[#717680] tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}

/**
 * Compact inline loader for data tables, modal dialogs, and cards.
 */
export function InlineLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 select-none">
      <BrandBirdEmblem size={56} />

      <div className="flex items-center gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-[#2D7A58]"
            animate={{
              opacity: [0.25, 1, 0.25],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {message && (
        <p className="mt-2 text-[11px] font-medium text-[#717680]">{message}</p>
      )}
    </div>
  );
}
