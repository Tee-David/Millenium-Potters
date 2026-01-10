"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function SmoothCursor() {
  const cursorSize = 20;
  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };

  const smoothOptions = { damping: 20, stiffness: 300, mass: 0.5 };
  const smoothMouse = {
    x: useSpring(mouse.x, smoothOptions),
    y: useSpring(mouse.y, smoothOptions),
  };

  const manageMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    mouse.x.set(clientX - cursorSize / 2);
    mouse.y.set(clientY - cursorSize / 2);
  };

  useEffect(() => {
    window.addEventListener("mousemove", manageMouseMove);
    return () => {
      window.removeEventListener("mousemove", manageMouseMove);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] hidden md:block"
      style={{
        left: smoothMouse.x,
        top: smoothMouse.y,
      }}
    >
      <div
        className="relative"
        style={{
          width: cursorSize,
          height: cursorSize,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 opacity-50 blur-sm" />
        <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-emerald-400 to-blue-400 opacity-80" />
        <div className="absolute inset-[5px] rounded-full bg-white dark:bg-gray-900" />
      </div>
    </motion.div>
  );
}
