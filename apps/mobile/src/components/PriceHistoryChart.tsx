"use client";

import { useEffect, useRef, useCallback } from "react";

// --- Seeded PRNG (mulberry32) for deterministic charts ---
function createRng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let v = Math.imul(t ^ (t >>> 15), 1 | t);
    v ^= v + Math.imul(v ^ (v >>> 7), 61 | v);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// --- Chart profile types ---
interface ChartProfile {
  volatility: number;
  drift: number;
  spikeFreq: number;
  spikeMag: number;
  meanRevert: number;
  noiseSmooth: number;
  anchorPrice: number;
}

// --- Per-market profiles keyed by market ID ---
const PROFILES: Record<string, Partial<ChartProfile>> = {
  "1": {
    volatility: 0.45,
    drift: 0,
    spikeFreq: 0.06,
    spikeMag: 2.5,
    meanRevert: 0.02,
    noiseSmooth: 0.6,
  },
  "2": {
    volatility: 0.2,
    drift: 0,
    spikeFreq: 0.02,
    spikeMag: 3.0,
    meanRevert: 0.04,
    noiseSmooth: 0.8,
  },
  "3": {
    volatility: 0.8,
    drift: 0.015,
    spikeFreq: 0.12,
    spikeMag: 2.0,
    meanRevert: 0.01,
    noiseSmooth: 0.3,
  },
  "4": {
    volatility: 0.18,
    drift: 0,
    spikeFreq: 0.01,
    spikeMag: 1.5,
    meanRevert: 0.06,
    noiseSmooth: 0.85,
  },
  "5": {
    volatility: 0.4,
    drift: 0.008,
    spikeFreq: 0.07,
    spikeMag: 2.2,
    meanRevert: 0.015,
    noiseSmooth: 0.55,
  },
  "6": {
    volatility: 0.55,
    drift: 0,
    spikeFreq: 0.09,
    spikeMag: 1.8,
    meanRevert: 0.08,
    noiseSmooth: 0.45,
  },
  "7": {
    volatility: 0.12,
    drift: 0,
    spikeFreq: 0.025,
    spikeMag: 5.0,
    meanRevert: 0.05,
    noiseSmooth: 0.9,
  },
  "8": {
    volatility: 0.42,
    drift: 0,
    spikeFreq: 0.05,
    spikeMag: 1.6,
    meanRevert: 0.03,
    noiseSmooth: 0.4,
  },
};

function getProfile(marketId: string, yesPrice: number): ChartProfile {
  const base: ChartProfile = {
    volatility: 0.35,
    drift: 0,
    spikeFreq: 0.05,
    spikeMag: 2.0,
    meanRevert: 0.03,
    noiseSmooth: 0.5,
    anchorPrice: yesPrice,
  };
  const overrides = PROFILES[marketId] || {};
  return { ...base, ...overrides, anchorPrice: yesPrice };
}

// --- Generate deterministic series once ---
function generateSeries(marketId: string, yesPrice: number): number[] {
  const profile = getProfile(marketId, yesPrice);
  const rng = createRng(hashString(marketId));
  const points = 120;
  const data: number[] = [];
  let price = profile.anchorPrice;

  for (let i = 0; i < points; i++) {
    const noise = (rng() - 0.5) * 2 * profile.volatility;
    const spike =
      rng() < profile.spikeFreq
        ? (rng() - 0.5) * 2 * profile.spikeMag * profile.volatility
        : 0;
    const revert = (profile.anchorPrice - price) * profile.meanRevert;

    price += noise + spike + revert + profile.drift;
    price = Math.max(1, Math.min(99, price));

    if (data.length > 0) {
      price =
        data[data.length - 1] * profile.noiseSmooth +
        price * (1 - profile.noiseSmooth);
    }

    data.push(price);
  }

  return data;
}

// --- Constants ---
const LINE_COLOR = "#2563EB";
const GRADIENT_TOP = "rgba(37, 99, 235, 0.18)";
const GRADIENT_BOT = "rgba(37, 99, 235, 0)";
const GRID_COLOR = "rgba(0,0,0,0.04)";
const LABEL_COLOR = "#9CA3AF";
const DOT_PULSE_PERIOD = 2000; // ms for one full pulse cycle

interface PriceHistoryChartProps {
  marketId: string;
  yesPrice: number;
}

export default function PriceHistoryChart({
  marketId,
  yesPrice,
}: PriceHistoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>([]);
  const animRef = useRef<number>(0);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const data = dataRef.current;
    if (data.length < 2) return;

    // Compute Y range with padding
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = range * 0.15;
    const yMin = min - pad;
    const yMax = max + pad;

    const chartLeft = 32;
    const chartRight = w - 12;
    const chartTop = 12;
    const chartBot = h - 20;
    const chartH = chartBot - chartTop;
    const chartW = chartRight - chartLeft;

    const toX = (i: number) =>
      chartLeft + (i / (data.length - 1)) * chartW;
    const toY = (v: number) =>
      chartBot - ((v - yMin) / (yMax - yMin)) * chartH;

    // Horizontal grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    const gridLines = 3;
    for (let g = 0; g <= gridLines; g++) {
      const gy = chartTop + (g / gridLines) * chartH;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Y-axis labels (left side)
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "right";
    for (let g = 0; g <= gridLines; g++) {
      const val = yMax - (g / gridLines) * (yMax - yMin);
      const gy = chartTop + (g / gridLines) * chartH;
      ctx.fillText(`${Math.round(val)}¢`, chartLeft - 4, gy - 3);
    }

    // Build smooth path using cardinal spline
    const tension = 0.3;
    const pts: [number, number][] = data.map((v, i) => [toX(i), toY(v)]);

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3;
      const cp1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3;
      const cp2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3;
      const cp2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
    }

    // Stroke line
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Fill gradient area
    const gradient = ctx.createLinearGradient(0, chartTop, 0, chartBot);
    gradient.addColorStop(0, GRADIENT_TOP);
    gradient.addColorStop(1, GRADIENT_BOT);

    ctx.lineTo(pts[pts.length - 1][0], chartBot);
    ctx.lineTo(pts[0][0], chartBot);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Endpoint dot with gentle pulse
    const lastPt = pts[pts.length - 1];
    const pulse = Math.sin((timestamp / DOT_PULSE_PERIOD) * Math.PI * 2);
    const dotRadius = 3.5 + pulse * 0.8; // 2.7 – 4.3
    const ringRadius = 7 + pulse * 1.5; // 5.5 – 8.5
    const ringAlpha = 0.18 + pulse * 0.08; // 0.10 – 0.26

    // Outer ring
    ctx.beginPath();
    ctx.arc(lastPt[0], lastPt[1], ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(37, 99, 235, ${ringAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(lastPt[0], lastPt[1], dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = LINE_COLOR;
    ctx.fill();

    // Time labels along bottom
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "9px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    const timeLabels = ["24h ago", "18h", "12h", "6h", "Now"];
    for (let t = 0; t < timeLabels.length; t++) {
      const tx = chartLeft + (t / (timeLabels.length - 1)) * chartW;
      ctx.fillText(timeLabels[t], tx, h - 4);
    }
  }, []);

  useEffect(() => {
    dataRef.current = generateSeries(marketId, yesPrice);

    let running = true;
    const loop = (timestamp: number) => {
      if (!running) return;
      draw(timestamp);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [marketId, yesPrice, draw]);

  return (
    <div className="rounded-xl bg-white border border-gray-100 mb-8 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          Price History
        </span>
        <span className="text-xs text-muted">24h</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 180, display: "block" }}
      />
    </div>
  );
}
