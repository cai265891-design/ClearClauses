import React from "react";

/**
 * 彩色线条 + 文字的加载动画，用于长耗时的 LLM 请求。
 * 样式内联定义，避免外部依赖。
 */
const LoadingLines: React.FC = () => {
  const letters = "Loading".split("");

  return (
    <div className="relative m-8 flex h-[120px] w-auto select-none items-center justify-center font-poppins text-[1.6em] font-semibold text-white scale-[1.6] md:scale-[2]">
      {/* Animated letters */}
      {letters.map((letter, idx) => (
        <span
          key={idx}
          className="relative z-[2] inline-block opacity-0 animate-[letterAnim_4s_linear_infinite] text-white"
          style={{ animationDelay: `${0.1 + idx * 0.105}s` }}
        >
          {letter}
        </span>
      ))}

      {/* Loader background */}
      <div className="absolute left-0 top-0 z-[1] h-full w-full bg-transparent [mask:repeating-linear-gradient(90deg,transparent_0,transparent_6px,black_7px,black_8px)]">
        <div
          className="absolute left-0 top-0 h-full w-full [background-image:radial-gradient(circle_at_50%_50%,#ff0_0%,transparent_50%),radial-gradient(circle_at_45%_45%,#f00_0%,transparent_45%),radial-gradient(circle_at_55%_55%,#0ff_0%,transparent_45%),radial-gradient(circle_at_45%_55%,#0f0_0%,transparent_45%),radial-gradient(circle_at_55%_45%,#00f_0%,transparent_45%)] [mask:radial-gradient(circle_at_50%_50%,transparent_0%,transparent_10%,black_25%)] animate-[transformAnim_2s_infinite_alternate_cubic-bezier(0.6,0.8,0.5,1),opacityAnim_4s_infinite]"
        />
      </div>

      <style jsx>{`
        @keyframes transformAnim {
          0% {
            transform: translate(-55%);
          }
          100% {
            transform: translate(55%);
          }
        }

        @keyframes opacityAnim {
          0%,
          100% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          65% {
            opacity: 0;
          }
        }

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
