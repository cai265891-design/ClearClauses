"use client";

import { type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TabContent {
  badge: string;
  title: string;
  description: string;
  buttonText?: string;
  imageSrc: string;
  imageAlt: string;
}

interface Tab {
  value: string;
  icon?: ReactNode;
  label: string;
  content: TabContent;
}

interface Feature108Props {
  badge?: string;
  heading?: string;
  description?: string;
  tabs?: Tab[];
}

const defaultTabs: Tab[] = [
  {
    value: "tab-1",
    label: "Boost revenue",
    icon: null,
    content: {
      badge: "Step 1",
      title: "Plan your flow",
      description: "Outline the user journey and make each step clear and actionable.",
      buttonText: "Get started",
      imageSrc: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Planning",
    },
  },
  {
    value: "tab-2",
    label: "Engage users",
    icon: null,
    content: {
      badge: "Step 2",
      title: "Add clarity",
      description: "Use concise copy and visuals so people know exactly what happens next.",
      buttonText: "See details",
      imageSrc: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Engagement",
    },
  },
  {
    value: "tab-3",
    label: "Ship faster",
    icon: null,
    content: {
      badge: "Step 3",
      title: "Launch with confidence",
      description: "Ship a polished experience backed by a predictable, repeatable process.",
      buttonText: "Launch",
      imageSrc: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Launch",
    },
  },
];

export function Feature108({
  badge = "How it works",
  heading = "A clear, guided flow for your users",
  description = "Switch between steps to see how the experience is organized.",
  tabs = defaultTabs,
}: Feature108Props) {
  const initialValue = tabs[0]?.value ?? "tab-1";

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-4 text-center">
          <Badge className="border-sky-200 bg-sky-50/70 text-sky-700 font-semibold tracking-[0.14em] uppercase">
            {badge}
          </Badge>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight md:text-4xl">
            {heading}
          </h2>
          <p className="max-w-3xl text-muted-foreground lg:text-lg leading-relaxed">
            {description}
          </p>
        </div>
        <Tabs defaultValue={initialValue} className="mt-10">
          <TabsList className="mx-auto flex w-full max-w-4xl flex-nowrap justify-center gap-3 overflow-x-auto bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur whitespace-nowrap data-[state=active]:border-sky-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-50 data-[state=active]:to-blue-50 data-[state=active]:text-sky-700 data-[state=active]:shadow-[0_10px_30px_-18px_rgba(14,116,144,0.6)]"
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative mx-auto mt-10 max-w-screen-xl overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/50 p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.65)] lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(59,130,246,0.1),transparent_35%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.12),transparent_30%)]" />
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="relative grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]"
              >
                <div className="flex flex-col gap-5">
                  <Badge variant="outline" className="w-fit border-slate-200 bg-white/80 text-slate-700">
                    {tab.content.badge}
                  </Badge>
                  <h3 className="text-3xl font-semibold leading-tight text-slate-900 lg:text-4xl">
                    {tab.content.title}
                  </h3>
                  <p className="max-w-2xl text-slate-600 lg:text-lg leading-relaxed">
                    {tab.content.description}
                  </p>
                  {tab.content.buttonText && (
                    <Button
                      className="mt-2.5 w-fit gap-2 rounded-full bg-gradient-to-r from-sky-600 via-sky-600 to-blue-600 px-6 shadow-lg shadow-sky-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                      size="lg"
                    >
                      {tab.content.buttonText}
                    </Button>
                  )}
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.6)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.14),transparent_30%)]" />
                  <img
                    src={tab.content.imageSrc}
                    alt={tab.content.imageAlt}
                    className="relative w-full rounded-2xl object-cover"
                  />
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  );
}

export default Feature108;
