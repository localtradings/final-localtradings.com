"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FeedbackFormProps = {
  source: "public-help" | "product-help";
  title?: string;
  description?: string;
};

export function FeedbackForm({
  source,
  title = "Send feedback",
  description = "Ask a question, report a bug, or tell us which lesson or tool needs work.",
}: FeedbackFormProps) {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
  }>({
    status: "idle",
  });

  async function handleSubmit(formData: FormData) {
    setState({ status: "loading" });

    const response = await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        topic: formData.get("topic"),
        message: formData.get("message"),
        source,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const payload = (await response.json().catch(() => ({}))) as { message?: string };

    if (!response.ok) {
      setState({
        status: "error",
        message: payload.message ?? "Feedback could not be sent.",
      });
      return;
    }

    setState({
      status: "success",
      message: payload.message ?? "Feedback sent.",
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-3">
        <h3 className="font-heading text-2xl font-extrabold">{title}</h3>
        <p className="text-sm leading-7 text-muted">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${source}-feedback-name`}>Name</Label>
          <Input
            autoComplete="name"
            id={`${source}-feedback-name`}
            maxLength={80}
            name="name"
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${source}-feedback-email`}>Email</Label>
          <Input
            autoComplete="email"
            id={`${source}-feedback-email`}
            maxLength={120}
            name="email"
            placeholder="Email address"
            required
            type="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${source}-feedback-topic`}>Topic</Label>
        <Select defaultValue="" id={`${source}-feedback-topic`} name="topic" required>
          <option disabled value="">
            Choose a topic
          </option>
          <option value="account">Account</option>
          <option value="learning">Learning</option>
          <option value="quiz">Quiz</option>
          <option value="backtesting">Backtesting</option>
          <option value="feedback">General feedback</option>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${source}-feedback-message`}>Message</Label>
        <Textarea
          id={`${source}-feedback-message`}
          maxLength={1200}
          minLength={20}
          name="message"
          placeholder="Tell us what you need help with."
          required
        />
        <p className="text-xs leading-5 text-muted">Use at least 20 characters so the issue is actionable.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? "Sending..." : "Submit feedback"}
        </Button>
        {state.message ? (
          <p
            className={
              state.status === "success" ? "text-sm text-success" : "text-sm text-danger"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
