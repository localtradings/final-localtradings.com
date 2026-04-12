import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  BACKTEST_INSTRUMENTS,
  BACKTEST_MAX_BARS_REQUESTED,
  BACKTEST_TIMEFRAMES,
} from "@/features/backtesting/constants";
import type { BacktestTimeframe } from "@/features/backtesting/types";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHistoricalBacktestCandles } from "@/server/backtesting/provider-candles";
import { TwelveDataError } from "@/server/backtesting/providers/twelve-data";
import {
  consumeRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
  normalizeRateLimitIdentifier,
} from "@/server/security/rate-limit";

const querySchema = z.object({
  symbol: z.enum(BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]]),
  timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
  windowStartAt: z.iso.datetime().optional(),
  barsRequested: z.coerce.number().int().positive().max(BACKTEST_MAX_BARS_REQUESTED).optional(),
});

const BACKTEST_CANDLE_RATE_LIMIT = {
  limit: 120,
  windowSeconds: 60,
};

export async function GET(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        message:
          "Signed-in backtesting requires Supabase configuration before historical data can load.",
      },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    scope: "api:backtesting-candles",
    identifier: normalizeRateLimitIdentifier(getClientIpFromHeaders(request.headers), user.id),
    limit: BACKTEST_CANDLE_RATE_LIMIT.limit,
    windowSeconds: BACKTEST_CANDLE_RATE_LIMIT.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        message: `Too many candle requests. Try again in ${formatRetryAfterSeconds(rateLimit.retryAfterSeconds)}.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const parsed = querySchema.safeParse({
    symbol: request.nextUrl.searchParams.get("symbol"),
    timeframe: request.nextUrl.searchParams.get("timeframe"),
    windowStartAt: request.nextUrl.searchParams.get("windowStartAt") ?? undefined,
    barsRequested: request.nextUrl.searchParams.get("barsRequested") ?? undefined,
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
    }, {
      windowStartAt: parsed.data.windowStartAt,
      barsRequested: parsed.data.barsRequested,
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
