import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResendConfirmationButton } from "@/components/resend-confirmation-button";

async function SuccessContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ email?: string }>;
}) {
  const { email } = await searchParamsPromise;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
        <CardDescription>Check your email to confirm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
          . Please check your inbox and confirm your account before signing in.
        </p>
        {email && <ResendConfirmationButton email={email} />}
      </CardContent>
    </Card>
  );
}

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-xl" />}>
          <SuccessContent searchParamsPromise={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
