import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBattleOpenRoomListings } from "@/server/battle/queries";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, message: "Authentication required." },
      { status: 401 },
    );
  }

  const openRooms = await getBattleOpenRoomListings();

  return NextResponse.json(
    { ok: true, openRooms },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
