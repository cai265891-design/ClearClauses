"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col min-h-screen items-center justify-center bg-white text-slate-950 transition-bg",
          className,
        )}
        {...props}
      >
        {/* Soft radial wash to desaturate edges */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.65),rgba(255,255,255,0.2)_45%,rgba(255,255,255,0)_70%)] pointer-events-none" />

        {/* Aurora animated layer */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              `
            [--aurora:repeating-linear-gradient(115deg,rgba(147,197,253,0.35)_10%,rgba(199,210,254,0.32)_20%,rgba(248,180,217,0.28)_30%,rgba(186,230,253,0.3)_40%,rgba(196,181,253,0.32)_50%,rgba(147,197,253,0.35)_60%)]
            [background-image:var(--aurora)]
            [background-size:280%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[14px]
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--aurora)] 
            after:[background-size:220%,_120%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-screen
            pointer-events-none
            absolute -inset-[16px] opacity-55 will-change-transform`,

              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_50%_50%,black_0%,transparent_75%)]`,
            )}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};
