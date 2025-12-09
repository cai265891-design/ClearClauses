import { respData, respErr } from "@/lib/resp";
import { runClauseRewrite } from "@/services/contract/optimize";
import {
  contractClauseSchema,
  kbItemSchema,
} from "@/services/contract/schemas";
import { z } from "zod";

const requestSchema = z.object({
  contract_metadata: z.record(z.unknown()).default({}),
  clause: contractClauseSchema,
  user_note: z.string().min(1),
  kb_items: z.array(kbItemSchema).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const { clause, traceId } = await runClauseRewrite({
      payload: {
        contract_metadata: parsed.contract_metadata,
        clause: parsed.clause,
        user_note: parsed.user_note,
        kb_items: parsed.kb_items,
      },
    });

    return respData({
      clause,
      trace_id: traceId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respErr(error.errors.map((e) => e.message).join("; "));
    }
    return respErr((error as Error).message || "contract optimize failed");
  }
}
