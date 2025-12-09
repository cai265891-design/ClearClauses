export async function GET(req: Request) {
  const url = new URL(req.url);
  const formatParam = url.searchParams.get("format") || "pdf";
  const format = formatParam === "docx" ? "docx" : "pdf";
  const allowed =
    url.searchParams.get("mock_allow") === "true" ||
    process.env.MOCK_ALLOW_DOWNLOAD === "true";

  if (!allowed) {
    return new Response(JSON.stringify({ code: -1, message: "permission denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filename = `contract.${format}`;
  const contentType =
    format === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";
  const body = `Contract download placeholder (${format}). Replace with generated document.`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
