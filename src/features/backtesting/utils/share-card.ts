import { getBacktestInstrument } from "../constants";
import type { BacktestSessionRecord, BacktestSessionStatus } from "../types";

type BacktestShareCardInput = {
  session: BacktestSessionRecord;
  traderName: string;
};

const CARD_SIZE = 1080;
const PADDING = 72;
const BRAND_ORANGE = "#FF7A1A";
const BRAND_ORANGE_LIGHT = "#FFB067";
const DARK_PANEL = "#121720";
const DARK_PANEL_ALT = "#151B24";
const TEXT_PRIMARY = "#F6F7F9";
const TEXT_MUTED = "#8A94A7";
const POSITIVE = "#3DDB88";
const NEGATIVE = "#FF626B";

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const clampedRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + clampedRadius, y);
  context.lineTo(x + width - clampedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  context.lineTo(x + width, y + height - clampedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  context.lineTo(x + clampedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  context.lineTo(x, y + clampedRadius);
  context.quadraticCurveTo(x, y, x + clampedRadius, y);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string | CanvasGradient,
) {
  context.save();
  roundRect(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
  context.restore();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number,
) {
  context.save();
  roundRect(context, x, y, width, height, radius);
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  context.stroke();
  context.restore();
}

function drawBackground(context: CanvasRenderingContext2D) {
  const baseGradient = context.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  baseGradient.addColorStop(0, "#07090D");
  baseGradient.addColorStop(0.55, "#0B1016");
  baseGradient.addColorStop(1, "#161009");
  context.fillStyle = baseGradient;
  context.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  const glowGradient = context.createRadialGradient(
    CARD_SIZE * 0.82,
    CARD_SIZE * 0.18,
    40,
    CARD_SIZE * 0.82,
    CARD_SIZE * 0.18,
    360,
  );
  glowGradient.addColorStop(0, "rgba(255,122,26,0.42)");
  glowGradient.addColorStop(0.45, "rgba(255,122,26,0.12)");
  glowGradient.addColorStop(1, "rgba(255,122,26,0)");
  context.fillStyle = glowGradient;
  context.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  context.save();
  context.strokeStyle = "rgba(255,255,255,0.035)";
  context.lineWidth = 1;
  for (let offset = 0; offset < CARD_SIZE; offset += 48) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset - CARD_SIZE * 0.3, CARD_SIZE);
    context.stroke();
  }
  context.restore();
}

function formatMoney(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function formatPrice(value: number | null | undefined, symbol: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(getBacktestInstrument(symbol).pricePrecision);
}

function formatMoment(value: string | null) {
  if (!value) {
    return "Simulated session";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function humanizeStatus(status: BacktestSessionStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusColor(status: BacktestSessionStatus) {
  if (status === "target_hit") {
    return POSITIVE;
  }

  if (status === "stop_hit") {
    return NEGATIVE;
  }

  return BRAND_ORANGE_LIGHT;
}

function getDirectionColor(direction: "Long" | "Short") {
  return direction === "Long" ? POSITIVE : NEGATIVE;
}

function getPositionReturnPercent(session: BacktestSessionRecord) {
  const entry = session.sessionStateJson.execution.entry ?? session.entry;
  const volume =
    session.sessionStateJson.execution.volume ??
    Number.parseFloat(session.sessionStateJson.tradeDraft.volume);
  const pnl = session.sessionStateJson.execution.resultAmount;

  if (
    typeof entry !== "number" ||
    Number.isNaN(entry) ||
    typeof volume !== "number" ||
    Number.isNaN(volume) ||
    volume <= 0 ||
    typeof pnl !== "number" ||
    Number.isNaN(pnl)
  ) {
    return null;
  }

  const positionNotional = Math.abs(entry * volume);
  if (!Number.isFinite(positionNotional) || positionNotional <= 0) {
    return null;
  }

  return (pnl / positionNotional) * 100;
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const href = canvas.toDataURL("image/png");
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  anchor.click();
}

export async function downloadBacktestShareCard({
  session,
  traderName,
}: BacktestShareCardInput) {
  const instrument = getBacktestInstrument(session.symbol);
  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize share canvas.");
  }

  drawBackground(context);

  const cardGradient = context.createLinearGradient(
    PADDING,
    PADDING,
    CARD_SIZE - PADDING,
    CARD_SIZE - PADDING,
  );
  cardGradient.addColorStop(0, "rgba(15,20,28,0.98)");
  cardGradient.addColorStop(1, "rgba(9,12,18,0.96)");
  fillRoundedRect(
    context,
    PADDING,
    PADDING,
    CARD_SIZE - PADDING * 2,
    CARD_SIZE - PADDING * 2,
    40,
    cardGradient,
  );
  strokeRoundedRect(
    context,
    PADDING,
    PADDING,
    CARD_SIZE - PADDING * 2,
    CARD_SIZE - PADDING * 2,
    40,
    "rgba(255,255,255,0.08)",
    2,
  );

  const logoImage = await loadImage("/localtradings-share-mark.svg");
  context.drawImage(logoImage, PADDING + 20, PADDING + 16, 150, 150);

  context.fillStyle = TEXT_MUTED;
  context.font = '600 24px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("SIMULATED TRADE", PADDING + 194, PADDING + 58);

  context.fillStyle = TEXT_PRIMARY;
  context.font = '700 34px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(traderName, PADDING + 194, PADDING + 102);

  context.fillStyle = TEXT_MUTED;
  context.font = '500 22px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(formatMoment(session.finishedAt ?? session.startedAt), PADDING + 194, PADDING + 138);

  const directionColor = getDirectionColor(session.direction);
  const directionBadgeWidth = 116;
  fillRoundedRect(context, CARD_SIZE - PADDING - 216, PADDING + 28, directionBadgeWidth, 50, 25, "rgba(255,255,255,0.06)");
  context.fillStyle = directionColor;
  context.font = '700 24px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(session.direction.toUpperCase(), CARD_SIZE - PADDING - 190, PADDING + 61);

  const statusBadgeColor = getStatusColor(session.status);
  fillRoundedRect(context, CARD_SIZE - PADDING - 216, PADDING + 92, 216, 54, 27, "rgba(255,255,255,0.06)");
  context.fillStyle = statusBadgeColor;
  context.font = '700 24px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(humanizeStatus(session.status).toUpperCase(), CARD_SIZE - PADDING - 194, PADDING + 128);

  const topRowY = PADDING + 190;
  const leftColumnX = PADDING + 24;
  const rightColumnX = CARD_SIZE - PADDING - 328;

  context.fillStyle = TEXT_MUTED;
  context.font = '600 22px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("SYMBOL", leftColumnX, topRowY);
  context.fillText("POSITION RETURN", rightColumnX, topRowY);

  context.fillStyle = TEXT_PRIMARY;
  context.font = '700 72px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(instrument.label, leftColumnX, topRowY + 78);

  const positionReturn = getPositionReturnPercent(session);
  context.fillStyle =
    positionReturn !== null && positionReturn < 0 ? NEGATIVE : POSITIVE;
  context.font = '700 96px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(formatPercent(positionReturn), rightColumnX, topRowY + 98);

  context.fillStyle = TEXT_MUTED;
  context.font = '500 20px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("Realized PnL on total position value", rightColumnX, topRowY + 130);

  const heroPanelY = PADDING + 340;
  const heroPanelWidth = CARD_SIZE - PADDING * 2 - 48;
  const heroPanelHeight = 220;
  const heroPanelGradient = context.createLinearGradient(
    leftColumnX,
    heroPanelY,
    leftColumnX + heroPanelWidth,
    heroPanelY + heroPanelHeight,
  );
  heroPanelGradient.addColorStop(0, "rgba(255,122,26,0.14)");
  heroPanelGradient.addColorStop(1, "rgba(255,122,26,0.02)");
  fillRoundedRect(context, leftColumnX, heroPanelY, heroPanelWidth, heroPanelHeight, 34, heroPanelGradient);
  strokeRoundedRect(context, leftColumnX, heroPanelY, heroPanelWidth, heroPanelHeight, 34, "rgba(255,255,255,0.07)", 2);

  context.fillStyle = TEXT_MUTED;
  context.font = '600 22px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("REALIZED PNL", leftColumnX + 32, heroPanelY + 48);

  context.fillStyle =
    (session.sessionStateJson.execution.resultAmount ?? 0) < 0 ? NEGATIVE : POSITIVE;
  context.font = '700 120px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(
    formatMoney(session.sessionStateJson.execution.resultAmount),
    leftColumnX + 28,
    heroPanelY + 162,
  );

  context.fillStyle = TEXT_MUTED;
  context.font = '500 20px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText(
    "Entry and exit values from your completed simulated trade",
    leftColumnX + 34,
    heroPanelY + 194,
  );

  const statCards = [
    {
      label: "ENTRY",
      value: formatPrice(session.sessionStateJson.execution.entry ?? session.entry, session.symbol),
      tone: TEXT_PRIMARY,
    },
    {
      label: "EXIT",
      value: formatPrice(session.sessionStateJson.execution.exitPrice, session.symbol),
      tone: TEXT_PRIMARY,
    },
    {
      label: "VOLUME",
      value:
        session.sessionStateJson.execution.volume !== null &&
        typeof session.sessionStateJson.execution.volume === "number"
          ? session.sessionStateJson.execution.volume.toFixed(2)
          : session.sessionStateJson.tradeDraft.volume,
      tone: TEXT_PRIMARY,
    },
  ];

  const statY = heroPanelY + heroPanelHeight + 34;
  const statWidth = (heroPanelWidth - 24) / 3;
  statCards.forEach((card, index) => {
    const x = leftColumnX + index * (statWidth + 12);
    fillRoundedRect(context, x, statY, statWidth, 118, 28, DARK_PANEL);
    strokeRoundedRect(context, x, statY, statWidth, 118, 28, "rgba(255,255,255,0.06)", 2);

    context.fillStyle = TEXT_MUTED;
    context.font = '600 20px "Trebuchet MS", "Segoe UI", sans-serif';
    context.fillText(card.label, x + 24, statY + 38);

    context.fillStyle = card.tone;
    context.font = '700 42px "Trebuchet MS", "Segoe UI", sans-serif';
    context.fillText(card.value, x + 24, statY + 86);
  });

  const ctaPanelY = CARD_SIZE - PADDING - 154;
  fillRoundedRect(
    context,
    leftColumnX,
    ctaPanelY,
    heroPanelWidth,
    96,
    28,
    DARK_PANEL_ALT,
  );
  strokeRoundedRect(
    context,
    leftColumnX,
    ctaPanelY,
    heroPanelWidth,
    96,
    28,
    "rgba(255,255,255,0.06)",
    2,
  );

  context.fillStyle = BRAND_ORANGE;
  context.font = '700 26px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("Trade your own simulated setups on localtradings.com", leftColumnX + 28, ctaPanelY + 40);

  context.fillStyle = TEXT_MUTED;
  context.font = '500 19px "Trebuchet MS", "Segoe UI", sans-serif';
  context.fillText("Structured practice. Honest results. Share the setup, not the hype.", leftColumnX + 28, ctaPanelY + 70);

  const fileName = `localtradings-simulated-trade-${session.symbol.toLowerCase()}-${session.id}.png`;
  downloadCanvas(canvas, fileName);
}
