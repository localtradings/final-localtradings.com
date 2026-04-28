"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">Full name</Label>
          <Input
            autoComplete="name"
            defaultValue={initialValues.fullName}
            id="profile-full-name"
            maxLength={80}
            name="fullName"
            placeholder="Full name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-display-name">Display name</Label>
          <Input
            autoComplete="nickname"
            defaultValue={initialValues.displayName}
            id="profile-display-name"
            maxLength={40}
            name="displayName"
            placeholder="Display name"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-focus-area">Focus area</Label>
        <Input
          defaultValue={initialValues.focusArea}
          id="profile-focus-area"
          maxLength={80}
          name="focusArea"
          placeholder="Candlesticks and risk management"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-bio">Bio</Label>
        <Textarea
          defaultValue={initialValues.bio}
          id="profile-bio"
          maxLength={300}
          minLength={10}
          name="bio"
          placeholder="Describe what you are working on in the platform."
          required
        />
        <p className="text-xs leading-5 text-muted">Keep this short. Maximum 300 characters.</p>
      </div>
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
