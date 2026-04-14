"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const getErrorMessage = (error: string | null) => {
  if (!error) {
    return "";
  }

  switch (error) {
    case "AccessDenied":
      return "Access denied. Try a different account.";
    case "CallbackRouteError":
    case "CredentialsSignin":
      return "Invalid email or password.";
    default:
      return "Unable to sign in right now.";
  }
};

interface SignInFormProps {
  emailVerificationEnabled: boolean;
}

export const SignInForm = ({ emailVerificationEnabled }: SignInFormProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = searchParams.get("error");
  const registered = searchParams.get("registered") === "1";
  const reset = searchParams.get("reset") === "1";
  const verified = searchParams.get("verified") === "1";
  const verificationState = searchParams.get("verification");
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [error, setError] = useState("");

  const pageError = useMemo(() => getErrorMessage(oauthError), [oauthError]);

  useEffect(() => {
    if (!registered && !reset && !verified && verificationState !== "invalid") {
      return;
    }

    if (registered) {
      toast.success(
        emailVerificationEnabled
          ? "Check your email to verify your account."
          : "Account created. You can now sign in.",
      );
    }

    if (verified) {
      toast.success("Email verified. You can now sign in.");
    }

    if (reset) {
      toast.success("Password updated. You can now sign in.");
    }

    if (verificationState === "invalid") {
      toast.error("That verification link is invalid or has expired.");
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("registered");
    nextParams.delete("reset");
    nextParams.delete("verified");
    nextParams.delete("verification");
    nextParams.delete("email");
    const nextSearch = nextParams.toString();

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  }, [
    emailVerificationEnabled,
    pathname,
    registered,
    reset,
    router,
    searchParams,
    verificationState,
    verified,
  ]);

  const handleCredentialsSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email: trimmedEmail,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result?.url ?? callbackUrl);
    router.refresh();
  };

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    await signIn("github", { callbackUrl });
  };

  const handleResendVerification = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Enter your email to resend the verification link.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsResendingVerification(true);
    setError("");

    const response = await fetch("/api/auth/verification/resend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    setIsResendingVerification(false);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Unable to resend verification email.");
      return;
    }

    toast.success("If your account exists and still needs verification, we sent a new link.");
  };

  return (
    <>
      {pageError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full justify-center"
        onClick={handleGithubSignIn}
        disabled={isSubmitting}
      >
        Sign in with GitHub
      </Button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <div className="h-px flex-1 bg-border/70" />
        <span>Or</span>
        <div className="h-px flex-1 bg-border/70" />
      </div>

      <form className="space-y-4" onSubmit={handleCredentialsSignIn}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pl-9"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-right">
          <Link
            href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      {emailVerificationEnabled ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Need a new verification email?
          <Button
            type="button"
            variant="link"
            className="h-auto px-1 align-baseline"
            onClick={handleResendVerification}
            disabled={isResendingVerification || isSubmitting}
          >
            {isResendingVerification ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
};
