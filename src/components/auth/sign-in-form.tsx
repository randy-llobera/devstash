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

export const SignInForm = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const oauthError = searchParams.get("error");
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const pageError = useMemo(() => getErrorMessage(oauthError), [oauthError]);

  useEffect(() => {
    if (!registered) {
      return;
    }

    toast.success("Account created. You can now log in.");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("registered");
    const nextSearch = nextParams.toString();

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  }, [pathname, registered, router, searchParams]);

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
      </form>

      <p className="text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
};
