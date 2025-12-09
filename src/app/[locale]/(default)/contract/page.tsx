import ContractPage from "@/components/contract/contract-page";

export default async function ContractRoute({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearch = (await searchParams) || {};
  const desc = resolvedSearch.desc;
  const initialDescription = Array.isArray(desc) ? desc[0] : desc;

  return <ContractPage initialDescription={initialDescription} />;
}
