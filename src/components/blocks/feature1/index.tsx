import Icon from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, ShieldCheck, Sparkles } from "lucide-react";
import { Section as SectionType } from "@/types/blocks/section";

const fallbackIcons = [Sparkles, ShieldCheck, LayoutGrid];

export default function Feature1({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const items = section.items || [];

  return (
    <section id={section.name} className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          {section.label && (
            <Badge
              variant="outline"
              className="mx-auto w-fit border-sky-200 bg-sky-50/60 text-sky-700 font-semibold tracking-[0.14em] uppercase"
            >
              {section.label}
            </Badge>
          )}
          {section.title && (
            <h2 className="text-pretty text-3xl font-bold leading-tight lg:text-4xl">
              {section.title}
            </h2>
          )}
          {section.description && (
            <p className="text-muted-foreground lg:text-lg leading-relaxed">
              {section.description}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {items.map((item, idx) => {
            const FallbackIcon = fallbackIcons[idx % fallbackIcons.length];
            const isHighlight = idx === 0;

            return (
              <div
                key={idx}
                className={`relative h-full overflow-hidden rounded-2xl border ring-1 p-6 lg:p-7 transition-transform duration-300 ease-out backdrop-blur-sm ${
                  isHighlight
                    ? "bg-gradient-to-br from-sky-50 via-white to-blue-50 border-sky-100/70 ring-sky-100/70 shadow-[0_25px_80px_-40px_rgba(14,116,144,0.6)] md:-translate-y-1"
                    : "bg-white/80 border-gray-100 ring-gray-100/60 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.45)] hover:-translate-y-1"
                }`}
              >
                <div
                  className={`absolute inset-0 pointer-events-none opacity-90 ${
                    isHighlight
                      ? "bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.16),transparent_30%)]"
                      : "bg-[radial-gradient(circle_at_10%_0%,rgba(148,163,184,0.09),transparent_32%)]"
                  }`}
                />

                <div className="relative flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex size-12 items-center justify-center rounded-xl border text-base shadow-sm ${
                        isHighlight
                          ? "bg-white/90 text-sky-700 border-white/70 shadow-inner"
                          : "bg-slate-50 text-slate-700 border-white"
                      }`}
                    >
                      {item.icon ? (
                        <Icon name={item.icon} className="size-5" />
                      ) : (
                        <FallbackIcon className="size-5" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-semibold leading-6 text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
