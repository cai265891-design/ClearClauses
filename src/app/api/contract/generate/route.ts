import { respData, respErr } from "@/lib/resp";
import { runContractGenerate } from "@/services/contract/generate";
import { selectKbItems } from "@/services/contract/kb";
import { briefSchema, kbItemSchema } from "@/services/contract/schemas";
import { z } from "zod";

const optionsSchema = z
  .object({
    locale: z.string().optional(),
    include_explanations: z.boolean().optional(),
    include_references: z.boolean().optional(),
  })
  .optional();

const requestSchema = z.object({
  brief: briefSchema,
  options: optionsSchema,
  extra_topics: z.array(z.string()).optional(),
  kb_items: z.array(kbItemSchema).optional(), // 允许前端传入已筛选好的 KB（可选）
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const kbItems =
      parsed.kb_items && parsed.kb_items.length
        ? parsed.kb_items
        : await selectKbItems(parsed.brief, 4, parsed.extra_topics);

    const { contract, traceId } = await runContractGenerate({
      brief: parsed.brief,
      options: parsed.options ?? {},
      kbItems,
    });

    return respData({
      contract,
      kb_items: kbItems,
      trace_id: traceId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respErr(error.errors.map((e) => e.message).join("; "));
    }
    return respErr((error as Error).message || "contract generate failed");
  }
}
