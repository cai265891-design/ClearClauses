"use client";

import { useState } from "react";
import { Hero as HeroType } from "@/types/blocks/hero";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function Hero({ hero }: { hero: HeroType }) {
  const router = useRouter();
  const [desc, setDesc] = useState("");

  if (hero.disabled) {
    return null;
  }

  const title = hero.title || "5-minute contracts for home service pros";
  const description =
    hero.description ||
    "Draft clear service agreements for cleaning, lawn care, pet sitting, and more.";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!desc.trim()) return;
    router.push(`/contract?desc=${encodeURIComponent(desc.trim())}`);
  };

  return (
    <section className="py-20 sm:py-24">
      <div className="container">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-[40px]">
            {title}
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <div className="flex w-full max-w-3xl items-center overflow-hidden rounded-full border border-muted-foreground/30 shadow-sm focus-within:ring-2 focus-within:ring-primary">
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe your service in one sentence..."
                className="w-full bg-transparent px-6 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className={cn(
                  "h-full shrink-0 bg-muted px-6 py-3 text-sm font-semibold text-foreground transition",
                  desc.trim() ? "hover:bg-muted-foreground/20" : "opacity-60",
                )}
                disabled={!desc.trim()}
              >
                Generate
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
