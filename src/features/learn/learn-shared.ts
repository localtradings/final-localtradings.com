import { cn } from "@/lib/utils";

export type LearnProgressStatus = "in_progress" | "completed" | null;
export type LearnProgressLabel = "In Progress" | "Completed" | null;

export function formatProgressStatus(status: LearnProgressStatus): LearnProgressLabel {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return null;
}

export function getDisplayStatus(status: LearnProgressLabel) {
  return status ?? "Not started";
}

export function getLessonActionLabel(status: LearnProgressLabel) {
  if (status === "Completed") {
    return "Review lesson";
  }

  if (status === "In Progress") {
    return "Resume lesson";
  }

  return "Start lesson";
}

export function getCompletionPercent(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
}

export function getStatusTextClass(statusLabel: string) {
  if (statusLabel === "Completed") {
    return "learn-tv-positive";
  }

  if (statusLabel === "In Progress") {
    return "text-primary";
  }

  return "text-muted";
}

export function getStatusChipClass(statusLabel: string) {
  return cn(
    "learn-tv-chip px-2.5 py-1 text-[0.62rem] tracking-[0.14em]",
    statusLabel === "Completed"
      ? "learn-tv-chip--positive"
      : statusLabel === "In Progress"
        ? "learn-tv-chip--active"
        : "",
  );
}

export function getBoardStatusChipClass(statusLabel: string) {
  return cn(
    "learn-tv-chip rounded-[0.6rem] px-2 py-[0.26rem] text-[0.54rem] tracking-[0.11em]",
    statusLabel === "Completed"
      ? "learn-tv-chip--positive"
      : statusLabel === "In Progress"
        ? "learn-tv-chip--active"
        : "",
  );
}
