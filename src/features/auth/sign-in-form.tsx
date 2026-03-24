"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/server/auth/actions";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = {
  status: "idle",
};

type SignInFormProps = {
  redirectTo?: string;
};

export function SignInForm({ redirectTo = "/app" }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" placeholder="you@example.com" required type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" placeholder="Minimum 8 characters" required type="password" />
      </div>
      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
      <p className="text-sm leading-7 text-muted">
        New here?{" "}
        <Link className="font-semibold text-primary" href="/sign-up">
          Create your account
        </Link>
      </p>
    </form>
  );
}
