import { respData, respErr } from "@/lib/resp";
import { runContractIntake } from "@/services/contract/intake";
import { z } from "zod";

const requestSchema = z.object({
  user_description: z.string().min(1),
  locale: z.string().optional(),
  default_currency: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);

    const { result, traceId } = await runContractIntake({
      userDescription: parsed.user_description,
      locale: parsed.locale,
      defaultCurrency: parsed.default_currency,
    });

    return respData({ result, trace_id: traceId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return respErr(error.errors.map((e) => e.message).join("; "));
    }
    return respErr((error as Error).message || "contract intake failed");
  }
}
