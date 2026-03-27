"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.06,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 12, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.35,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.form
      action={formAction}
      animate="visible"
      className="space-y-6"
      initial="hidden"
      variants={containerVariants}
    >
      <input name="redirectTo" type="hidden" value={redirectTo} />

      <motion.div
        className="flex items-center justify-between rounded-[var(--radius-lg)] border border-outline/16 bg-surface-low/70 px-4 py-3 text-xs text-muted"
        variants={itemVariants}
      >
        <span className="font-medium">Email and password only for v1.</span>
        <Link
          className="inline-flex items-center gap-2 font-semibold text-primary transition hover:text-primary/80"
          href="/help"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Need help?
        </Link>
      </motion.div>

      <motion.div className="space-y-2" variants={itemVariants}>
        <Label htmlFor="email">Email</Label>
        <Input
          className="min-h-12 rounded-[var(--radius-xl)] border-outline/18 bg-surface-low/90 px-4"
          id="email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </motion.div>

      <motion.div className="space-y-2" variants={itemVariants}>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <span className="text-xs font-medium text-muted">
            Case-sensitive
          </span>
        </div>
        <Input
          className="min-h-12 rounded-[var(--radius-xl)] border-outline/18 bg-surface-low/90 px-4"
          id="password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </motion.div>

      {state.message ? (
        <motion.p
          className={
            state.status === "error"
              ? "rounded-[var(--radius-lg)] border border-danger/25 bg-danger/8 px-4 py-3 text-sm text-danger"
              : "rounded-[var(--radius-lg)] border border-success/25 bg-success/8 px-4 py-3 text-sm text-success"
          }
          variants={itemVariants}
        >
          {state.message}
        </motion.p>
      ) : null}

      <motion.div className="space-y-4" variants={itemVariants}>
        <Button
          className="min-h-12 w-full rounded-[var(--radius-xl)] text-base"
          disabled={isPending}
          size="lg"
          type="submit"
        >
          {isPending ? "Signing in..." : "Sign In"}
          {!isPending ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <p className="text-center text-sm leading-7 text-muted">
          New here?{" "}
          <Link className="font-semibold text-primary transition hover:text-primary/80" href="/sign-up">
            Create your account
          </Link>
        </p>
      </motion.div>
    </motion.form>
  );
}
