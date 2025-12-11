"use client";

import Feature108 from "@/components/ui/shadcnblocks-com-feature108";
import Icon from "@/components/icon";
import { Layout, Pointer, Zap } from "lucide-react";
import { Section as SectionType } from "@/types/blocks/section";

export default function Feature2({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const fallbackIcons = [
    <Zap key="zap" className="h-4 w-4" />,
    <Pointer key="pointer" className="h-4 w-4" />,
    <Layout key="layout" className="h-4 w-4" />,
  ];

  const fallbackImages = [
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  ];

  const tabs =
    section.items?.map((item, idx) => {
      const value = `tab-${idx + 1}`;
      const iconNode = item.icon ? (
        <Icon name={item.icon} className="h-4 w-4" />
      ) : (
        fallbackIcons[idx % fallbackIcons.length]
      );
      return {
        value,
        icon: iconNode,
        label: item.label || `Step ${idx + 1}`,
        content: {
          badge: item.label || `Step ${idx + 1}`,
          title: item.title || `Step ${idx + 1}`,
          description: item.description || "",
          buttonText: item.buttons?.[0]?.title || "Start now",
          imageSrc: item.image?.src || fallbackImages[idx % fallbackImages.length],
          imageAlt: item.image?.alt || item.title || `step-${idx + 1}`,
        },
      };
    }) || [];

  return (
    <div id={section.name}>
      <Feature108
        badge={section.label || "How it works"}
        heading={section.title || "How it works in 3 steps"}
        description={section.description || ""}
        tabs={tabs.length ? tabs : undefined}
      />
    </div>
  );
}
