import { Variants, Transition } from 'framer-motion'

// ============================================
// SPRING CONFIGURATIONS
// ============================================
export const springs = {
  // Snappy - quick response for buttons/clicks
  snappy: { type: 'spring', stiffness: 400, damping: 25 } as Transition,
  // Smooth - general purpose animations
  smooth: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  // Bouncy - playful feel for celebrations
  bouncy: { type: 'spring', stiffness: 500, damping: 15 } as Transition,
  // Gentle - slow, subtle animations
  gentle: { type: 'spring', stiffness: 200, damping: 20 } as Transition,
  // Stiff - minimal bounce
  stiff: { type: 'spring', stiffness: 600, damping: 40 } as Transition,
}

// ============================================
// DURATION PRESETS
// ============================================
export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
}

// ============================================
// EASING CURVES
// ============================================
export const easings = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.65, 0, 0.35, 1],
  elastic: [0.68, -0.55, 0.265, 1.55],
}

// ============================================
// FADE VARIANTS
// ============================================
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: durations.normal }
  },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springs.smooth
  },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: springs.smooth
  },
}

// ============================================
// SCALE VARIANTS
// ============================================
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springs.bouncy
  },
}

export const scaleInCenter: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springs.bouncy
  },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: springs.bouncy
  },
}

// ============================================
// STAGGER CONTAINER VARIANTS
// ============================================
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

// ============================================
// STAGGER ITEM VARIANTS
// ============================================
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springs.smooth
  },
}

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: springs.smooth
  },
}

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================
export const pageSlideUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  },
}

export const pageSlideRight: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    x: 30,
    transition: { duration: 0.3 }
  },
}

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  },
}

export const pageScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: easings.easeOut }
  },
  exit: { 
    opacity: 0, 
    scale: 1.02,
    transition: { duration: 0.3 }
  },
}

// ============================================
// HOVER & TAP ANIMATIONS
// ============================================
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: springs.snappy,
}

export const hoverScaleLarge = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: springs.snappy,
}

export const hoverLift = {
  whileHover: { y: -4, scale: 1.02 },
  whileTap: { y: 0, scale: 0.98 },
  transition: springs.snappy,
}

export const hoverGlow = {
  whileHover: { 
    boxShadow: '0 0 20px rgba(var(--primary), 0.3)',
    scale: 1.01
  },
  transition: springs.smooth,
}

// ============================================
// MAGNETIC BUTTON UTILITIES
// ============================================
export const magneticConfig = {
  strength: 0.3, // How much the element moves (0-1)
  radius: 100,   // Distance in px where effect starts
}

// ============================================
// SKELETON/LOADING ANIMATIONS
// ============================================
export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

export const pulse: Variants = {
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// ============================================
// CELEBRATION ANIMATIONS
// ============================================
export const celebrateIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.3,
    rotate: -10 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    rotate: 0,
    transition: {
      ...springs.bouncy,
      duration: 0.6,
    }
  },
}

export const bounceIn: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0,
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: [0, 1.2, 1],
    y: 0,
    transition: {
      duration: 0.5,
      times: [0, 0.6, 1],
    }
  },
}

// ============================================
// FLOATING ANIMATION (for FAB, badges, etc.)
// ============================================
export const floatingAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

export const pulseRing = {
  scale: [1, 1.2, 1],
  opacity: [0.7, 0, 0.7],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// ============================================
// DRAWER/SHEET ANIMATIONS
// ============================================
export const slideInFromRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.3, ease: easings.easeOut }
  },
  exit: { 
    x: '100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  },
}

export const slideInFromBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.3, ease: easings.easeOut }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: { duration: 0.2 }
  },
}

// ============================================
// GLASSMORPHISM UTILITY CLASSES
// ============================================
export const glassStyles = {
  light: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl',
  dark: 'bg-black/30 backdrop-blur-xl border border-white/10 shadow-xl',
  primary: 'bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-xl',
  subtle: 'bg-card/80 backdrop-blur-md border border-border/50',
}

// ============================================
// CSS ANIMATION KEYFRAMES (to add to CSS)
// ============================================
export const cssAnimations = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1); opacity: 0.7; }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes border-dance {
  0% { background-position: 0% 0%; }
  100% { background-position: 300% 0%; }
}

.animate-shimmer {
  animation: shimmer 2s linear infinite;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.1) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-ring {
  animation: pulse-ring 2s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dark .glass-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.gradient-border {
  position: relative;
  background: linear-gradient(var(--background), var(--background)) padding-box,
              linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5), hsl(var(--primary))) border-box;
  border: 2px solid transparent;
}

.hover-glow {
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(var(--primary), 0.2);
}
`
