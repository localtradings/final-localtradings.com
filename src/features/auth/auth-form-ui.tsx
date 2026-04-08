"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Apple, ArrowRight, Check, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { cn } from "@/lib/utils";

export function AuthPanelHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-4 text-center text-white">
      <h1 className="font-heading text-[1.46rem] font-black tracking-[-0.05em] sm:text-[1.72rem]">
        {title}
      </h1>
      <p className="mt-1 text-[0.82rem] leading-5 text-white/60">{description}</p>
    </div>
  );
}

export function AuthNotice({
  tone,
  message,
}: {
  tone: "error" | "success" | "info";
  message: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[0.9rem] border px-3.5 py-2.5 text-[0.82rem] leading-5",
        tone === "error" && "border-[#ff6f91]/28 bg-[#2c0b15]/70 text-[#ffc3cf]",
        tone === "success" && "border-[#19ff97]/22 bg-[#082616]/78 text-[#a2ffd1]",
        tone === "info" && "border-white/10 bg-white/[0.03] text-white/72",
      )}
    >
      {message}
    </div>
  );
}

export function AuthField({
  id,
  name,
  type = "text",
  placeholder,
  icon,
  rightSlot,
  required,
  autoComplete,
  defaultValue,
}: {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon: "mail" | "lock" | "user";
  rightSlot?: ReactNode;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
}) {
  const Icon = icon === "mail" ? Mail : icon === "lock" ? Lock : User;

  return (
    <div className="space-y-1.5">
      <label className="block text-[0.88rem] font-medium text-white/96" htmlFor={id}>
        {id}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/42">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
        </span>
        <input
          autoComplete={autoComplete}
          className="h-[2.75rem] w-full rounded-[0.9rem] border border-white/10 bg-[rgba(15,20,28,0.92)] pl-[2.75rem] pr-[2.75rem] text-[0.88rem] text-white outline-none transition placeholder:text-white/34 focus:border-[#18ff95]/48 focus:ring-4 focus:ring-[#18ff95]/10"
          defaultValue={defaultValue}
          id={id}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
        {rightSlot ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/56">
            {rightSlot}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PasswordRevealButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/56 transition hover:bg-white/6 hover:text-white"
      onClick={onClick}
      type="button"
    >
      {visible ? <EyeOff className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Eye className="h-4.5 w-4.5" strokeWidth={1.8} />}
    </button>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className="mt-1 inline-flex h-[3rem] w-full items-center justify-center gap-2.5 rounded-[0.9rem] bg-[linear-gradient(180deg,#25ff9d,#13ca68)] text-[0.9rem] font-black uppercase tracking-[-0.02em] text-black shadow-[0_0_0_1px_rgba(177,255,216,0.2),0_16px_34px_rgba(7,255,146,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      type="submit"
    >
      <span>{children}</span>
      <ArrowRight className="h-4.5 w-4.5" strokeWidth={2.4} />
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="mt-3.5 flex items-center gap-3 text-center">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white/44">
        Or
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function SocialButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      className="inline-flex h-[2.8rem] w-full items-center justify-center gap-2.5 rounded-[0.9rem] border border-white/12 bg-transparent px-4 text-[0.82rem] font-medium text-white transition hover:border-white/20 hover:bg-white/[0.03]"
      href={href}
      prefetch={false}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function AuthSocialButtons({
  mode,
  redirectTo = "/app",
}: {
  mode: "sign-in" | "sign-up";
  redirectTo?: string;
}) {
  const next = redirectTo.startsWith("/app") ? redirectTo : "/app";

  return (
    <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
      <SocialButton
        href={`/auth/oauth?provider=apple&source=${mode}&next=${encodeURIComponent(next)}`}
        icon={<Apple className="h-5 w-5" strokeWidth={2.1} />}
        label="Continue with Apple"
      />
      <SocialButton
        href={`/auth/oauth?provider=google&source=${mode}&next=${encodeURIComponent(next)}`}
        icon={
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.9rem] font-black text-[#1f1f1f]">
            G
          </span>
        }
        label="Continue with Google"
      />
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-4 text-center text-[0.84rem] text-white/50">
      {prompt}{" "}
      <Link className="font-semibold text-[#17ff95] transition hover:text-[#7bffbf]" href={href}>
        {label}
      </Link>
    </p>
  );
}

export function AuthRequirement({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-[0.82rem]", met ? "text-white/88" : "text-white/46")}>
      <span
        className={cn(
          "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border",
          met ? "border-[#19ff97] text-[#19ff97]" : "border-white/18 text-white/32",
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </div>
  );
}

export function AuthCheckbox({
  id,
  name,
  label,
  required = false,
  defaultChecked = false,
  linkLabel,
  linkHref,
  suffix,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultChecked?: boolean;
  linkLabel?: string;
  linkHref?: string;
  suffix?: string;
}) {
  return (
    <label className="inline-flex items-start gap-2.5 text-[0.84rem] leading-6 text-white/82" htmlFor={id}>
      <input
        className="mt-[0.24rem] h-5 w-5 rounded-[0.3rem] border border-white/18 bg-transparent accent-[#15f58e]"
        defaultChecked={defaultChecked}
        id={id}
        name={name}
        required={required}
        type="checkbox"
      />
      <span>
        {label}{" "}
        {linkLabel && linkHref ? (
          <Link className="font-medium text-[#15f58e] transition hover:text-[#7cffbf]" href={linkHref}>
            {linkLabel}
          </Link>
        ) : null}
        {suffix ? <span>{suffix}</span> : null}
      </span>
    </label>
  );
}
