import { respData } from "@/lib/resp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mockAllow =
    url.searchParams.get("mock_allow") === "true" ||
    process.env.MOCK_ALLOW_DOWNLOAD === "true";

  const allowed = mockAllow || false;
  const reason = allowed ? undefined : "permission check placeholder";

  return respData({ allowed, reason });
}
