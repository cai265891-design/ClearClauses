"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, Sparkles } from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity),
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

interface HeroChatProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

export default function RuixenMoonChat({
  title = "5-minute contracts for home service pros",
  subtitle = "Draft clear service agreements for cleaning, lawn care, pet sitting, and more.",
  placeholder = "Describe your service in one sentence…",
}: HeroChatProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 120,
  });

  const handleSubmit = useCallback(
    (evt?: React.FormEvent) => {
      evt?.preventDefault();
      const value = message.trim();
      if (!value) return;
      router.push(`/contract?desc=${encodeURIComponent(value)}`);
    },
    [message, router],
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-transparent text-slate-950 transition-bg">
      <div className="w-full max-w-5xl text-center relative -translate-y-[30px]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-neutral-600 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <span className="inline-flex h-6 items-center rounded-full bg-blue-100 px-2 text-blue-700">
            New
          </span>
          <span>Home & pet care contracts in minutes</span>
          <ArrowUpIcon className="h-3 w-3 rotate-45 text-neutral-500" />
        </div>

        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-[44px]">
          {title}
        </h1>
        <p className="mt-3 text-base text-neutral-600 sm:text-lg">{subtitle}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full max-w-3xl mx-auto overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-black/5"
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            placeholder={placeholder}
            className={cn(
              "w-full resize-none border-none bg-transparent px-5 py-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400",
              "focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[48px]",
            )}
            style={{ overflow: "hidden" }}
          />
          <div className="flex items-center justify-end px-4 pb-4 pt-2">
            <button
              type="submit"
              disabled={!message.trim()}
              className="flex h-10 items-center gap-2 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              <ArrowUpIcon className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-500">
          <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 ring-1 ring-black/5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Try prompts:</span>
          </div>
          {[
            "Bi-weekly cleaning, $120 per visit",
            "Weekly lawn mowing & edging",
            "Overnight pet sitting for small dogs",
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setMessage(item);
                setTimeout(() => adjustHeight(), 0);
              }}
              className="rounded-full bg-white/80 px-3 py-1 text-neutral-700 ring-1 ring-black/5 transition hover:bg-white"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
