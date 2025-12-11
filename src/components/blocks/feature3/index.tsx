import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Section as SectionType } from "@/types/blocks/section";
import { FileText, Layers } from "lucide-react";

export default function Feature3({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  const fallbackImages = [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1400&q=80",
  ];

  const icons = [FileText, Layers];

  return (
    <section id={section.name} className="py-16 md:py-24">
      <div className="container">
        <div className="mb-10 space-y-3 text-center">
          {section.label && (
            <Badge variant="outline" className="mx-auto w-fit">
              {section.label}
            </Badge>
          )}
          <h2 className="text-pretty text-3xl font-bold lg:text-4xl">
            {section.title}
          </h2>
          <p className="text-muted-foreground lg:text-lg">
            {section.description}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {section.items?.slice(0, 2).map((item, index) => {
            const IconComp = icons[index % icons.length];
            const imageSrc = item.image?.src || fallbackImages[index % fallbackImages.length];
            const imageAlt = item.image?.alt || item.title || "story";
            return (
              <Card key={index} className="overflow-hidden border bg-background/80 shadow-sm">
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader className="gap-2">
                  <div className="flex items-center gap-2 text-primary">
                    <IconComp className="size-5" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Story {index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                {item.buttons?.length ? (
                  <CardContent className="pb-6">
                    <a
                      href={item.buttons[0].url || "#"}
                      className="text-sm font-semibold text-primary hover:underline"
                      target={item.buttons[0].target}
                    >
                      {item.buttons[0].title}
                    </a>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
