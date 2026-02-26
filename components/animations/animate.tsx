"use client";

import { motion, type Transition, type Variants } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────
   EASING
   Typed as [number, number, number, number] = BezierDefinition
   so framer-motion accepts it without casting anywhere.
───────────────────────────────────────── */
export type BezierEase = [number, number, number, number];

export const ease: BezierEase = [0.16, 1, 0.3, 1];
export const easeOut: BezierEase = [0.0, 0.0, 0.2, 1];

/* ─────────────────────────────────────────
   useInViewManual
   Replaces framer's useInView so we control the margin ourselves
   without fighting its MarginType branded string.
───────────────────────────────────────── */
function useInViewManual(
  ref: React.RefObject<HTMLDivElement | null>,
  options: { once?: boolean; rootMargin?: string } = {},
): boolean {
  const [inView, setInView] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.once !== false) {
            triggered.current = true;
            observer.disconnect();
          }
        } else if (options.once === false && !triggered.current) {
          setInView(false);
        }
      },
      { rootMargin: options.rootMargin ?? "-60px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return inView;
}

/* ─────────────────────────────────────────
   ANIMATION VARIANTS
   ease is typed as BezierEase so Transition accepts it directly.
───────────────────────────────────────── */

/** fadein — opacity + lift + blur */
const fadeinVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, y: 22, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** slideright — slide from right + scale + fade */
const sliderightVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, x: 48, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** slideleft — slide from left + scale + fade */
const slideleftVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, x: -44, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** popin — scale-up pop + lift + fade */
const popinVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, scale: 0.86, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** slideup — upward lift + scale + fade (card entrance) */
const slideupVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** growx — horizontal scale-in from left (divider lines) */
const growxVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, scaleX: 0 },
  visible: {
    opacity: 1,
    scaleX: 1,
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/** slideleftitem — small left-shift + blur (checklist items) */
const slideleftitemVariants = (duration: number, delay: number): Variants => ({
  hidden: { opacity: 0, x: -16, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration, ease, delay } satisfies Transition,
  },
});

/**
 * stagger — orchestrates children in sequence.
 * Apply to the parent; use any animation type on each child.
 */
const staggerVariants = (
  staggerChildren: number,
  delayChildren: number,
): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren } satisfies Transition,
  },
});

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
export type AnimateType =
  | "fadein"
  | "slideright"
  | "slideleft"
  | "popin"
  | "slideup"
  | "growx"
  | "slideleftitem"
  | "stagger";

export interface AnimateProps {
  /** Animation type */
  type: AnimateType;
  /** Duration in seconds */
  duration?: number;
  /** Delay in seconds (default: 0) */
  delay?: number;
  /** Trigger animation only once (default: true) */
  once?: boolean;
  /**
   * IntersectionObserver rootMargin before triggering.
   * Standard CSS margin syntax e.g. "-60px" or "-40px 0px"
   * (default: "-60px")
   */
  margin?: string;
  /** Stagger interval between children — type="stagger" only (default: 0.11s) */
  staggerChildren?: number;
  /** Delay before first staggered child — type="stagger" only (default: 0.08s) */
  delayChildren?: number;
  /** Transform origin X for growx (default: 0 = left edge) */
  originX?: number;
  /**
   * Gate that holds the animation until data/images are ready.
   * Element stays in "hidden" state even if in viewport while ready=false.
   * (default: true)
   */
  ready?: boolean;
  /** Content to animate. Optional so bare elements like dividers can use it. */
  children?: React.ReactNode;
  className?: string;
}

/* ─────────────────────────────────────────
   DEFAULT DURATIONS
───────────────────────────────────────── */
const defaultDurations: Record<AnimateType, number> = {
  fadein: 0.85,
  slideright: 1.1,
  slideleft: 1.05,
  popin: 0.65,
  slideup: 0.6,
  growx: 0.7,
  slideleftitem: 0.65,
  stagger: 0,
};

/* ─────────────────────────────────────────
   ANIMATE COMPONENT
───────────────────────────────────────── */
const Animate: React.FC<AnimateProps> = ({
  type,
  duration,
  delay = 0,
  once = true,
  margin = "-60px",
  staggerChildren = 0.11,
  delayChildren = 0.08,
  originX = 0,
  ready = true,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewManual(ref, { once, rootMargin: margin });

  const dur = duration ?? defaultDurations[type];
  const shouldAnimate = inView && ready;

  let variants: Variants;
  switch (type) {
    case "fadein":
      variants = fadeinVariants(dur, delay);
      break;
    case "slideright":
      variants = sliderightVariants(dur, delay);
      break;
    case "slideleft":
      variants = slideleftVariants(dur, delay);
      break;
    case "popin":
      variants = popinVariants(dur, delay);
      break;
    case "slideup":
      variants = slideupVariants(dur, delay);
      break;
    case "growx":
      variants = growxVariants(dur, delay);
      break;
    case "slideleftitem":
      variants = slideleftitemVariants(dur, delay);
      break;
    case "stagger":
      variants = staggerVariants(staggerChildren, delayChildren);
      break;
    default:
      variants = fadeinVariants(dur, delay);
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      style={type === "growx" ? { originX } : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Animate;
