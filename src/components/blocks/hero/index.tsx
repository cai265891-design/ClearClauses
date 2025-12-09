"use client";

import RuixenMoonChat from "@/components/ui/ruixen-moon-chat";
import { Hero as HeroType } from "@/types/blocks/hero";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  return (
    <RuixenMoonChat
      title={hero.title || "5-minute contracts for home service pros"}
      subtitle={
        hero.description ||
        "Draft clear service agreements for cleaning, lawn care, pet sitting, and more."
      }
      placeholder="Describe your service in one sentence..."
    />
  );
}
