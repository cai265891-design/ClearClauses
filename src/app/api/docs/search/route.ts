import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/open-source/supported-languages
  language: "english",
  // 将 zh 映射为英文分词，避免不支持的语言报错
  localeMap: {
    zh: "english",
    en: "english",
  },
});
