"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import React from "react";

// One easing curve and one duration scale keep every motion consistent.
export const motionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const motionDuration = {
  micro: 0.15,
  standard: 0.22,
  page: 0.32,
} as const;

const smoothEase = motionEase;

export const transitions = {
  subtle: {
    duration: motionDuration.micro,
    ease: smoothEase,
  },
  smooth: {
    duration: motionDuration.page,
    ease: smoothEase,
  },
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
  microTap: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionDuration.standard,
      ease: smoothEase,
    },
  },
};

export interface FadeInProps extends HTMLMotionProps<"div"> {
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  direction = "up",
  distance = 6,
  delay = 0,
  duration = motionDuration.standard,
  className,
  ...props
}: FadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { y: distance, x: 0 };
      case "down":
        return { y: -distance, x: 0 };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const initial = { opacity: 0, ...getInitialPosition() };

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: smoothEase,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={staggerItemVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
