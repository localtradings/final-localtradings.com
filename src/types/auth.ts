export type ActionStatus = "idle" | "success" | "error";

export type ActionState = {
  status: ActionStatus;
  message?: string;
};
