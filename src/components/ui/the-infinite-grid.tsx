"use client";

import React, { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";

interface InfiniteGridBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function InfiniteGridBackground({
  children,
  className,
  ...props
}: InfiniteGridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const patternId = useId();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.35;
  const speedY = 0.35;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % 40);
    gridOffsetY.set((currentY + speedY) % 40);
  });

  useEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(rect.width / 2);
    mouseY.set(rect.height / 2);
  }, [mouseX, mouseY]);

  const maskImage = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white text-slate-950 transition-bg",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 opacity-5">
        <GridPattern id={patternId} offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>
      <motion.div
        className="absolute inset-0 z-0 opacity-35"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern id={`${patternId}-mask`} offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-20%] top-[-22%] h-[42%] w-[42%] rounded-full bg-orange-400/30 dark:bg-orange-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[-8%] h-[24%] w-[24%] rounded-full bg-blue-500/25 blur-[110px]" />
        <div className="absolute left-[-12%] bottom-[-20%] h-[42%] w-[42%] rounded-full bg-sky-400/25 dark:bg-sky-500/18 blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center px-4">{children}</div>
    </div>
  );
}

function GridPattern({
  id,
  offsetX,
  offsetY,
}: {
  id: string;
  offsetX: any;
  offsetY: any;
}) {
  return (
    <svg className="h-full w-full">
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-400"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
