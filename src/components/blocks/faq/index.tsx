import Faq5 from "@/components/ui/faq-5";
import { Section as SectionType } from "@/types/blocks/section";

export default function FAQ({ section }: { section: SectionType }) {
  if (section.disabled) {
    return null;
  }

  return (
    <div id={section.name}>
      <Faq5
        badge={section.label || "FAQ"}
        heading={section.title || "Common Questions & Answers"}
        description={section.description || ""}
        faqs={
          section.items?.map((item) => ({
            question: item.title || "",
            answer: item.description || "",
          })) || []
        }
      />
    </div>
  );
}
