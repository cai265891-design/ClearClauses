import SignForm from "@/components/sign/form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  if (!isAuthEnabled()) {
    return redirect("/");
  }

  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (session) {
    return redirect(callbackUrl || "/");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border text-primary-foreground overflow-hidden">
            <Image src="/logo.png" alt="logo" width={16} height={16} />
          </div>
          {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </Link>
        <SignForm />
      </div>
    </div>
  );
}
