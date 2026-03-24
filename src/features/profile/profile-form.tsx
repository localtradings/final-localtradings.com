"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { upsertProfile } from "@/server/profile/actions";
import type { ActionState } from "@/types/auth";

type ProfileFormProps = {
  initialValues: {
    fullName: string;
    displayName: string;
    focusArea: string;
    bio: string;
  };
};

const initialState: ActionState = {
  status: "idle",
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    upsertProfile,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Input defaultValue={initialValues.fullName} name="fullName" placeholder="Full name" />
        <Input
          defaultValue={initialValues.displayName}
          name="displayName"
          placeholder="Display name"
        />
      </div>
      <Input defaultValue={initialValues.focusArea} name="focusArea" placeholder="Focus area" />
      <Textarea defaultValue={initialValues.bio} name="bio" />
      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-success"}>
          {state.message}
        </p>
      ) : null}
      <Button disabled={isPending} type="submit">
        {isPending ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
