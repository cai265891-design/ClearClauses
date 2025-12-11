import React from "react";

/**
 * 彩色线条 + 文字的加载动画，用于长耗时的 LLM 请求。
 * 样式内联定义，避免外部依赖。
 */
const LoadingLines: React.FC = () => {
  const letters = "Loading".split("");

  return (
    <div className="relative m-8 flex h-[120px] w-auto select-none items-center justify-center font-poppins text-[1.6em] font-semibold text-neutral-600 scale-[1.4] md:scale-[1.8]">
      {/* Animated letters */}
      {letters.map((letter, idx) => (
        <span
          key={idx}
          className="relative z-[2] inline-block opacity-0 animate-[letterAnim_4s_linear_infinite] text-neutral-600"
          style={{ animationDelay: `${0.1 + idx * 0.105}s` }}
        >
          {letter}
        </span>
      ))}

      <style jsx>{`
        @keyframes letterAnim {
          0% {
            opacity: 0;
          }
          5% {
            opacity: 1;
            text-shadow: 0 0 4px #fff;
            transform: scale(1.1) translateY(-2px);
          }
          20% {
            opacity: 0.2;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingLines;
