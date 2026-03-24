"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp } from "@/server/auth/actions";
import type { ActionState } from "@/types/auth";

const initialState: ActionState = {
  status: "idle",
};

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="fullName">
          Full name
        </label>
        <Input id="fullName" name="fullName" placeholder="Your full name" required />
      </div>
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
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-sm leading-7 text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-primary" href="/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
}
