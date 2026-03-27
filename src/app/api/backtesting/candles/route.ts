import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  BACKTEST_INSTRUMENTS,
  BACKTEST_TIMEFRAMES,
} from "@/features/backtesting/constants";
import type { BacktestTimeframe } from "@/features/backtesting/types";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHistoricalBacktestCandles } from "@/server/backtesting/provider-candles";
import { TwelveDataError } from "@/server/backtesting/providers/twelve-data";

const querySchema = z.object({
  symbol: z.enum(BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]]),
  timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
});

export async function GET(request: NextRequest) {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const parsed = querySchema.safeParse({
    symbol: request.nextUrl.searchParams.get("symbol"),
    timeframe: request.nextUrl.searchParams.get("timeframe"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Provide a valid symbol and timeframe." },
      { status: 400 },
    );
  }

  try {
    const payload = await getHistoricalBacktestCandles({
      symbol: parsed.data.symbol,
      timeframe: parsed.data.timeframe as BacktestTimeframe,
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof TwelveDataError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { message: "Unable to load historical candles for that replay window." },
      { status: 500 },
    );
  }
}
