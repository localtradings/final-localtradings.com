"use client";

import { useEffect, useState } from "react";

type BookmarkFeedback = {
  id: number;
  message: string;
};

export function useBookmarkFeedback() {
  const [toast, setToast] = useState<BookmarkFeedback | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return {
    toast,
    pushToast(message: string) {
      setToast({ id: Date.now(), message });
    },
  };
}

export function BookmarkFeedbackToast({
  toast,
}: {
  toast: BookmarkFeedback | null;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-[0.9rem] border border-outline-variant/70 bg-[rgba(13,15,20,0.96)] px-4 py-3 text-[12px] font-semibold text-foreground shadow-[0_18px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:text-[13px]">
      {toast.message}
    </div>
  );
}
