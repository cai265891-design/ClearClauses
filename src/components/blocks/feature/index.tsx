import Icon from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Section as SectionType } from "@/types/blocks/section";

function parseComparison(description: string) {
  const labels = [
    { key: "templates", marker: "Templates:" },
    { key: "genericAi", marker: "Generic AI:" },
    { key: "thisTool", marker: "This tool:" },
  ] as const;

  const positions = labels
    .map((item) => ({
      key: item.key,
      marker: item.marker,
      index: description.indexOf(item.marker),
    }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);

  if (!positions.length) {
    return {
      templates: "",
      genericAi: "",
      thisTool: description,
    };
  }

  const result: Record<"templates" | "genericAi" | "thisTool", string> = {
    templates: "",
    genericAi: "",
    thisTool: "",
  };

  positions.forEach((pos, idx) => {
    const start = pos.index + pos.marker.length;
    const end = positions[idx + 1]?.index ?? description.length;
    const content = description.slice(start, end).trim();
    if (pos.key === "templates") result.templates = content;
    if (pos.key === "genericAi") result.genericAi = content;
    if (pos.key === "thisTool") result.thisTool = content;
  });

  return result;
}

export default function Feature({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const columns = [
    {
      key: "templates" as const,
      label: "Templates",
      subtitle: "Download-and-edit forms",
      highlight: false,
      accentClass: "from-gray-50 via-white to-gray-100",
    },
    {
      key: "genericAi" as const,
      label: "Generic AI",
      subtitle: "Prompt-dependent outputs",
      highlight: false,
      accentClass: "from-gray-50 via-white to-slate-100",
    },
    {
      key: "thisTool" as const,
      label: "This tool",
      subtitle: "Built for home & pet care",
      highlight: true,
      accentClass: "from-sky-50 via-white to-blue-50",
    },
  ];

  const itemsByColumn = columns.map((col) => ({
    ...col,
    items:
      section.items?.map((item) => {
        const parsed = parseComparison(item.description || "");
        return {
          feature: item.title,
          text: parsed[col.key] || "—",
          icon: item.icon,
        };
      }) || [],
  }));

  return (
    <section id={section.name} className="py-16 md:py-20">
      <div className="container max-w-6xl">
        <div className="flex flex-col items-center px-4">
          {section.label && (
            <Badge variant="outline" className="w-fit">
              {section.label}
            </Badge>
          )}
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mt-3 md:mt-4">
            {section.title}
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-600 text-center max-w-2xl mx-auto leading-relaxed">
            {section.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-12 px-4">
          {itemsByColumn.map((col) => (
            <div
              key={col.key}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 lg:p-7 flex flex-col h-full transition-transform duration-300 ease-out",
                "bg-gradient-to-br",
                col.accentClass,
                col.highlight
                  ? "shadow-[0_20px_60px_-30px_rgba(14,116,144,0.45)] ring-1 ring-sky-100/70"
                  : "shadow-[0_14px_40px_-30px_rgba(15,23,42,0.25)] ring-1 ring-gray-100 hover:-translate-y-1"
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none opacity-80",
                  col.highlight
                    ? "bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.16),transparent_30%)]"
                    : "bg-[radial-gradient(circle_at_20%_0%,rgba(148,163,184,0.08),transparent_30%)]"
                )}
              />

              <div className="relative flex flex-col h-full">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.14em]",
                        col.highlight
                          ? "border-sky-200 bg-white/80 text-sky-700 backdrop-blur"
                          : "border-gray-200 bg-white/80 text-gray-700 backdrop-blur"
                      )}
                    >
                      {col.label}
                    </span>
                    {col.highlight && (
                      <div className="inline-flex items-center rounded-full bg-sky-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                        Recommended
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">{col.subtitle}</p>
                    <p className="text-sm text-gray-600">
                      {col.highlight ? "Purpose-built, guided, and consistent" : "Baseline option with trade-offs"}
                    </p>
                  </div>
                </div>

                <div className="relative mt-6 space-y-4 divide-y divide-gray-200/60">
                  {col.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 pt-0 first:pt-0">
                      <div
                        className={cn(
                          "mt-1 h-10 w-10 flex items-center justify-center rounded-xl border text-base",
                          col.highlight
                            ? "bg-white/80 border-white/70 text-sky-700 shadow-inner backdrop-blur"
                            : "bg-white border-gray-200 text-gray-600 shadow-sm"
                        )}
                      >
                        {item.icon ? (
                          <Icon name={item.icon} className="h-5 w-5" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{section.items?.[idx]?.title}</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {col.highlight && (
                  <div className="mt-auto">
                    <button className="mt-8 w-full rounded-full bg-gradient-to-r from-sky-600 via-sky-600 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200/70 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-50">
                      Get a draft in 5 minutes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
