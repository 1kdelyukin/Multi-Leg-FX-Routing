"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart2, CircleDot, LineChart, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Nav } from "@/components/Nav";
import { getCurrencyFlag } from "@/lib/formatting";

type AnalyticsMode = "fiat" | "crypto";
type Timeframe = "7D" | "30D" | "90D" | "1Y";
type ChartStatus = "idle" | "loading" | "ready" | "error";

const TIMEFRAME_TITLE: Record<Timeframe, string> = {
  "7D":  "7 Days",
  "30D": "30 Days",
  "90D": "90 Days",
  "1Y":  "1 Year",
};

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
};

const CHART_POINTS: Record<Timeframe, number> = {
  "7D": 28,
  "30D": 34,
  "90D": 42,
  "1Y": 52,
};

const STABLECOIN_HISTORY_SOURCE = "DeltaMarkets (fawazahmed0)";
const STABLECOIN_FALLBACK_SOURCE = "USD peg fallback";

interface PairingCard {
  code: string;
  name: string;
  rate: string;
  weeklyChange: string;
  weeklyPercent: string;
  direction: "up" | "down";
  history: Record<Timeframe, number[]>;
  high52: string;
  low52: string;
}

interface ChartPoint {
  date: string;
  rate: number;
  sourceDate?: string;
  filled?: boolean;
}

interface ChartState {
  status: ChartStatus;
  points: ChartPoint[];
  source?: string;
  error?: string;
}

interface HistoricalRateResponse {
  source?: string;
  points?: ChartPoint[];
  error?: string;
}

function makeFlatHistory(rate: number): Record<Timeframe, number[]> {
  return {
    "7D": [rate],
    "30D": [rate],
    "90D": [rate],
    "1Y": [rate],
  };
}

function getPairingKey(mode: AnalyticsMode, code: string): string {
  return `${mode}-${code}`;
}

function getHistoryUrl(code: string, timeframe: Timeframe): string {
  return `/api/analytics/history?base=USD&quote=${encodeURIComponent(
    code,
  )}&days=${TIMEFRAME_DAYS[timeframe]}`;
}

const FIAT_PAIRINGS: PairingCard[] = [
  {
    code: "EUR", name: "Euro", rate: "0.853545", weeklyChange: "+0.0032", weeklyPercent: "0.37%", direction: "up", high52: "0.9150", low52: "0.8220",
    history: {
      "7D":  [0.8490,0.8502,0.8487,0.8514,0.8498,0.8475,0.8492,0.8518,0.8503,0.8528,0.8511,0.8495,0.8522,0.8538,0.8515,0.8504,0.8531,0.8518,0.8545,0.8522,0.8506,0.8534,0.8519,0.8548,0.8525,0.8512,0.8540,0.8524,0.8509,0.8536,0.8520,0.8548,0.8530,0.8515,0.8543,0.8527,0.8514,0.8541,0.8525,0.8538,0.8526,0.8535],
      "30D": [0.8420,0.8448,0.8432,0.8462,0.8445,0.8472,0.8455,0.8438,0.8468,0.8484,0.8465,0.8480,0.8498,0.8478,0.8508,0.8490,0.8472,0.8502,0.8518,0.8498,0.8528,0.8510,0.8492,0.8522,0.8505,0.8535,0.8518,0.8528,0.8512,0.8535],
      "90D": [0.8310,0.8335,0.8318,0.8345,0.8328,0.8358,0.8340,0.8322,0.8352,0.8372,0.8355,0.8378,0.8360,0.8342,0.8372,0.8390,0.8372,0.8398,0.8380,0.8362,0.8390,0.8410,0.8392,0.8418,0.8400,0.8382,0.8412,0.8432,0.8415,0.8440,0.8422,0.8404,0.8432,0.8452,0.8435,0.8462,0.8444,0.8428,0.8455,0.8475,0.8492,0.8472,0.8498,0.8478,0.8535],
      "1Y":  [0.9050,0.8998,0.9032,0.8975,0.9012,0.8958,0.8992,0.8935,0.8968,0.8912,0.8948,0.8895,0.8928,0.8875,0.8908,0.8855,0.8888,0.8838,0.8872,0.8818,0.8852,0.8802,0.8835,0.8780,0.8812,0.8758,0.8792,0.8738,0.8772,0.8718,0.8752,0.8702,0.8735,0.8682,0.8715,0.8660,0.8695,0.8642,0.8675,0.8625,0.8658,0.8608,0.8642,0.8595,0.8628,0.8612,0.8645,0.8630,0.8615,0.8638,0.8622,0.8535],
    },
  },
  {
    code: "GBP", name: "British Pound", rate: "0.739236", weeklyChange: "+0.0042", weeklyPercent: "0.58%", direction: "up", high52: "0.7890", low52: "0.7120",
    history: {
      "7D":  [0.7340,0.7355,0.7338,0.7362,0.7345,0.7325,0.7342,0.7368,0.7352,0.7378,0.7360,0.7345,0.7372,0.7388,0.7365,0.7352,0.7380,0.7368,0.7395,0.7372,0.7358,0.7382,0.7368,0.7398,0.7375,0.7360,0.7388,0.7372,0.7358,0.7386,0.7370,0.7398,0.7382,0.7365,0.7392,0.7376,0.7362,0.7390,0.7374,0.7388,0.7375,0.7392],
      "30D": [0.7270,0.7295,0.7278,0.7308,0.7290,0.7318,0.7300,0.7282,0.7312,0.7332,0.7312,0.7328,0.7345,0.7325,0.7355,0.7335,0.7318,0.7348,0.7365,0.7345,0.7375,0.7355,0.7338,0.7368,0.7350,0.7382,0.7362,0.7375,0.7358,0.7392],
      "90D": [0.7190,0.7212,0.7195,0.7222,0.7205,0.7235,0.7218,0.7198,0.7228,0.7248,0.7228,0.7255,0.7238,0.7218,0.7248,0.7268,0.7248,0.7278,0.7258,0.7238,0.7268,0.7292,0.7272,0.7298,0.7278,0.7258,0.7288,0.7310,0.7292,0.7318,0.7298,0.7278,0.7308,0.7330,0.7312,0.7340,0.7322,0.7305,0.7332,0.7355,0.7372,0.7352,0.7378,0.7358,0.7392],
      "1Y":  [0.7780,0.7728,0.7762,0.7705,0.7742,0.7688,0.7722,0.7665,0.7702,0.7648,0.7682,0.7628,0.7662,0.7608,0.7642,0.7592,0.7622,0.7572,0.7605,0.7555,0.7588,0.7535,0.7568,0.7515,0.7548,0.7498,0.7528,0.7478,0.7508,0.7458,0.7488,0.7440,0.7472,0.7422,0.7455,0.7408,0.7440,0.7395,0.7425,0.7382,0.7412,0.7368,0.7398,0.7355,0.7385,0.7368,0.7352,0.7370,0.7385,0.7368,0.7382,0.7392],
    },
  },
  {
    code: "JPY", name: "Japanese Yen", rate: "157.876", weeklyChange: "+1.6634", weeklyPercent: "1.06%", direction: "up", high52: "162.50", low52: "140.30",
    history: {
      "7D":  [155.80,156.12,155.75,156.38,156.05,155.68,156.25,156.62,156.30,156.75,156.45,156.10,156.55,156.92,156.60,156.28,156.72,156.40,156.88,156.55,156.22,156.70,156.38,156.88,157.05,156.72,157.18,156.85,156.52,157.02,156.68,157.22,156.88,156.55,157.08,156.75,156.42,157.00,156.68,157.25,156.95,157.876],
      "30D": [154.20,154.55,154.22,154.88,154.55,154.22,154.68,155.12,154.78,155.28,154.95,154.62,155.08,155.58,155.25,154.92,155.42,155.08,155.62,155.28,154.95,155.48,155.15,155.75,155.42,156.05,156.72,156.38,157.15,157.876],
      "90D": [148.50,149.05,148.62,149.28,148.85,149.52,149.08,148.65,149.32,149.92,149.48,150.12,149.68,149.25,149.92,150.55,150.12,150.78,150.35,149.92,150.62,151.25,150.82,151.48,151.05,150.62,151.32,151.98,151.55,152.25,151.82,151.38,152.12,152.78,152.35,153.08,152.65,152.22,152.98,153.68,154.32,155.05,155.78,156.52,157.876],
      "1Y":  [140.50,141.25,140.72,141.88,141.35,142.18,141.65,142.48,141.95,142.78,143.52,142.98,143.82,143.28,144.15,143.62,144.48,143.95,144.82,145.58,145.05,145.92,145.38,146.25,145.72,146.58,147.35,146.82,147.68,148.45,147.92,148.78,149.55,149.02,149.88,150.65,150.12,150.98,151.75,151.22,152.08,153.85,153.32,154.18,154.95,154.42,155.28,156.05,155.52,156.38,157.15,157.876],
    },
  },
  {
    code: "CAD", name: "Canadian Dollar", rate: "1.37061", weeklyChange: "+0.0075", weeklyPercent: "0.55%", direction: "up", high52: "1.4450", low52: "1.3180",
    history: {
      "7D":  [1.3620,1.3638,1.3618,1.3648,1.3628,1.3608,1.3632,1.3658,1.3638,1.3668,1.3648,1.3628,1.3655,1.3678,1.3658,1.3635,1.3662,1.3642,1.3672,1.3650,1.3628,1.3658,1.3638,1.3668,1.3648,1.3628,1.3658,1.3642,1.3625,1.3652,1.3638,1.3665,1.3648,1.3628,1.3658,1.3672,1.3652,1.3678,1.3662,1.3688,1.3672,1.3706],
      "30D": [1.3580,1.3605,1.3585,1.3615,1.3592,1.3620,1.3598,1.3578,1.3608,1.3630,1.3608,1.3628,1.3648,1.3625,1.3652,1.3628,1.3608,1.3638,1.3658,1.3635,1.3665,1.3642,1.3622,1.3652,1.3632,1.3662,1.3642,1.3672,1.3652,1.3706],
      "90D": [1.3420,1.3445,1.3422,1.3452,1.3428,1.3458,1.3432,1.3412,1.3442,1.3468,1.3445,1.3472,1.3448,1.3428,1.3458,1.3485,1.3462,1.3490,1.3465,1.3442,1.3472,1.3498,1.3475,1.3505,1.3480,1.3458,1.3488,1.3515,1.3492,1.3522,1.3498,1.3475,1.3505,1.3532,1.3508,1.3538,1.3515,1.3492,1.3522,1.3548,1.3572,1.3548,1.3578,1.3555,1.3706],
      "1Y":  [1.4200,1.4148,1.4182,1.4125,1.4162,1.4108,1.4142,1.4088,1.4022,1.3968,1.4005,1.3948,1.3982,1.3925,1.3960,1.3905,1.3938,1.3882,1.3918,1.3862,1.3895,1.3838,1.3872,1.3815,1.3848,1.3792,1.3825,1.3768,1.3802,1.3745,1.3778,1.3722,1.3755,1.3698,1.3732,1.3678,1.3712,1.3658,1.3692,1.3638,1.3672,1.3618,1.3652,1.3598,1.3630,1.3610,1.3648,1.3628,1.3612,1.3645,1.3668,1.3706],
    },
  },
  {
    code: "AUD", name: "Australian Dollar", rate: "1.37965", weeklyChange: "-0.0004", weeklyPercent: "0.03%", direction: "down", high52: "1.6120", low52: "1.3400",
    history: {
      "7D":  [1.3820,1.3808,1.3832,1.3815,1.3840,1.3822,1.3805,1.3828,1.3812,1.3838,1.3820,1.3845,1.3828,1.3810,1.3835,1.3818,1.3842,1.3825,1.3808,1.3832,1.3815,1.3840,1.3822,1.3804,1.3828,1.3812,1.3836,1.3818,1.3802,1.3826,1.3810,1.3835,1.3818,1.3800,1.3824,1.3808,1.3832,1.3815,1.3798,1.3820,1.3804,1.3797],
      "30D": [1.3830,1.3842,1.3828,1.3845,1.3832,1.3848,1.3835,1.3820,1.3838,1.3852,1.3838,1.3852,1.3838,1.3855,1.3840,1.3825,1.3842,1.3828,1.3845,1.3830,1.3815,1.3832,1.3818,1.3835,1.3820,1.3838,1.3822,1.3812,1.3805,1.3797],
      "90D": [1.4010,1.3998,1.4015,1.4002,1.4020,1.4005,1.3990,1.4008,1.3992,1.4010,1.3995,1.3980,1.3998,1.3982,1.4000,1.3985,1.3968,1.3986,1.3970,1.3988,1.3972,1.3955,1.3972,1.3956,1.3975,1.3958,1.3942,1.3960,1.3945,1.3962,1.3945,1.3928,1.3945,1.3930,1.3948,1.3932,1.3915,1.3932,1.3918,1.3936,1.3920,1.3905,1.3898,1.3850,1.3797],
      "1Y":  [1.5800,1.5725,1.5768,1.5692,1.5738,1.5662,1.5705,1.5628,1.5572,1.5495,1.5538,1.5462,1.5405,1.5328,1.5272,1.5195,1.5140,1.5062,1.5005,1.4928,1.4872,1.4795,1.4738,1.4662,1.4605,1.4528,1.4472,1.4395,1.4338,1.4262,1.4205,1.4128,1.4072,1.3995,1.3938,1.3862,1.3905,1.3828,1.3872,1.3795,1.3840,1.3762,1.3808,1.3730,1.3775,1.3810,1.3785,1.3825,1.3808,1.3840,1.3815,1.3797],
    },
  },
  {
    code: "CHF", name: "Swiss Franc", rate: "0.781434", weeklyChange: "+0.0032", weeklyPercent: "0.41%", direction: "up", high52: "0.9270", low52: "0.7560",
    history: {
      "7D":  [0.7780,0.7792,0.7775,0.7798,0.7782,0.7762,0.7782,0.7805,0.7788,0.7812,0.7795,0.7778,0.7798,0.7818,0.7802,0.7782,0.7805,0.7788,0.7812,0.7795,0.7778,0.7802,0.7785,0.7808,0.7792,0.7772,0.7795,0.7778,0.7762,0.7788,0.7772,0.7798,0.7782,0.7762,0.7788,0.7805,0.7788,0.7812,0.7795,0.7818,0.7802,0.7814],
      "30D": [0.7745,0.7768,0.7748,0.7775,0.7755,0.7782,0.7762,0.7742,0.7768,0.7788,0.7768,0.7785,0.7805,0.7782,0.7808,0.7785,0.7762,0.7788,0.7808,0.7785,0.7812,0.7788,0.7768,0.7795,0.7775,0.7802,0.7782,0.7798,0.7778,0.7814],
      "90D": [0.7640,0.7662,0.7645,0.7668,0.7648,0.7675,0.7655,0.7635,0.7658,0.7678,0.7658,0.7682,0.7662,0.7642,0.7668,0.7692,0.7672,0.7698,0.7678,0.7658,0.7682,0.7705,0.7685,0.7712,0.7692,0.7672,0.7698,0.7722,0.7702,0.7728,0.7708,0.7688,0.7712,0.7735,0.7715,0.7742,0.7722,0.7702,0.7728,0.7752,0.7775,0.7755,0.7782,0.7762,0.7814],
      "1Y":  [0.9100,0.9045,0.9082,0.9025,0.9062,0.9005,0.8942,0.8885,0.8925,0.8868,0.8905,0.8848,0.8785,0.8728,0.8768,0.8712,0.8748,0.8692,0.8628,0.8572,0.8612,0.8558,0.8592,0.8535,0.8472,0.8415,0.8452,0.8395,0.8432,0.8375,0.8312,0.8255,0.8298,0.8242,0.8278,0.8225,0.8182,0.8125,0.8162,0.8108,0.8068,0.8015,0.8052,0.8008,0.8045,0.8008,0.8038,0.7985,0.7942,0.7892,0.7852,0.7814],
    },
  },
];

const CRYPTO_PAIRINGS: PairingCard[] = [
  {
    code: "USDT", name: "Tether USD", rate: "1.0000", weeklyChange: "+0.0000", weeklyPercent: "0.00%", direction: "up", high52: "1.0000", low52: "1.0000",
    history: makeFlatHistory(1),
  },
  {
    code: "USDC", name: "USD Coin", rate: "1.0000", weeklyChange: "+0.0000", weeklyPercent: "0.00%", direction: "up", high52: "1.0000", low52: "1.0000",
    history: makeFlatHistory(1),
  },
];

function parseRate(value: string): number {
  return Number(value.replace(/,/g, ""));
}

function getCurrentRate(pairing: PairingCard): number {
  const current = parseRate(pairing.rate);
  return Number.isFinite(current) ? current : 0;
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eachCalendarDate(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    dates.push(toIsoDate(cursor));
    cursor = addCalendarDays(cursor, 1);
  }

  return dates;
}

function withCurrentRate(values: number[], current: number): number[] {
  const history = [...values];

  if (history.length > 0) {
    history[history.length - 1] = current;
  }

  return history;
}

function sampleSeries(values: number[], targetLength: number): number[] {
  if (targetLength <= 0 || values.length === 0) {
    return [];
  }

  if (targetLength === 1) {
    return [values[values.length - 1]];
  }

  if (values.length === 1) {
    return Array.from({ length: targetLength }, () => values[0]);
  }

  return Array.from({ length: targetLength }, (_, index) => {
    const position = (index / (targetLength - 1)) * (values.length - 1);
    const leftIndex = Math.floor(position);
    const rightIndex = Math.min(values.length - 1, leftIndex + 1);
    const weight = position - leftIndex;
    return values[leftIndex] + (values[rightIndex] - values[leftIndex]) * weight;
  });
}

function getRawTimeframeHistory(pairing: PairingCard, timeframe: Timeframe): number[] {
  return withCurrentRate(pairing.history[timeframe], getCurrentRate(pairing));
}

function overlayTrailingWindow(
  yearHistory: number[],
  windowHistory: number[],
  weekCount: number,
): number[] {
  if (yearHistory.length === 0 || windowHistory.length === 0) {
    return yearHistory;
  }

  const sampleCount = Math.min(yearHistory.length, weekCount);
  const sampledWindow = sampleSeries(windowHistory, sampleCount);
  const merged = [...yearHistory];
  const start = merged.length - sampledWindow.length;

  sampledWindow.forEach((value, index) => {
    merged[start + index] = value;
  });

  return merged;
}

function getCoherentYearHistory(pairing: PairingCard): number[] {
  const yearHistory = getRawTimeframeHistory(pairing, "1Y");

  // Stitch the detailed zoom ranges into the overview so every tab agrees near "Today".
  return (["90D", "30D", "7D"] as Timeframe[]).reduce((history, timeframe) => {
    const weekCount = Math.ceil(TIMEFRAME_DAYS[timeframe] / 7) + 1;
    return overlayTrailingWindow(history, getRawTimeframeHistory(pairing, timeframe), weekCount);
  }, yearHistory);
}

function getTimeframeHistory(pairing: PairingCard, timeframe: Timeframe): number[] {
  if (timeframe === "1Y") {
    return getCoherentYearHistory(pairing);
  }

  return sampleSeries(getRawTimeframeHistory(pairing, timeframe), CHART_POINTS[timeframe]);
}

function getPairingStats(pairing: PairingCard, timeframe: Timeframe) {
  const yearHistory = getCoherentYearHistory(pairing);
  const rangeHistory = getTimeframeHistory(pairing, timeframe);
  const current = rangeHistory[rangeHistory.length - 1] ?? getCurrentRate(pairing);
  const yearValues = yearHistory.length > 0 ? yearHistory : [current];
  const rangeValues = rangeHistory.length > 0 ? rangeHistory : [current];
  const previous = rangeHistory[0] ?? current;
  const change = current - previous;
  const percent = previous === 0 ? 0 : (change / previous) * 100;
  const decimals = current >= 10 ? 3 : 6;

  return {
    current,
    currentText: current.toFixed(decimals),
    high52: Math.max(...yearValues).toFixed(decimals),
    low52: Math.min(...yearValues).toFixed(decimals),
    rangeChangeText: `${change >= 0 ? "+" : ""}${change.toFixed(decimals)}`,
    rangePercentText: `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`,
    direction: change >= 0 ? "up" as const : "down" as const,
    history: rangeValues,
  };
}

function getStaticChartPoints(pairing: PairingCard, timeframe: Timeframe): ChartPoint[] {
  const today = getLocalToday();
  const start = addCalendarDays(today, -TIMEFRAME_DAYS[timeframe]);
  const dates = eachCalendarDate(start, today);
  const rates = sampleSeries(getTimeframeHistory(pairing, timeframe), dates.length);

  return dates.map((date, index) => ({
    date,
    rate: rates[index] ?? rates[rates.length - 1] ?? getCurrentRate(pairing),
    sourceDate: date,
    filled: false,
  }));
}

function getStatsFromChartPoints(points: ChartPoint[]) {
  const safePoints = points.length > 0 ? points : [{ date: toIsoDate(getLocalToday()), rate: 0 }];
  const first = safePoints[0].rate;
  const current = safePoints[safePoints.length - 1].rate;
  const change = current - first;
  const percent = first === 0 ? 0 : (change / first) * 100;
  const decimals = current >= 10 ? 3 : 6;

  return {
    current,
    currentText: current.toFixed(decimals),
    high: Math.max(...safePoints.map((point) => point.rate)).toFixed(decimals),
    low: Math.min(...safePoints.map((point) => point.rate)).toFixed(decimals),
    rangeChangeText: `${change >= 0 ? "+" : ""}${change.toFixed(decimals)}`,
    rangePercentText: `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`,
    direction: change >= 0 ? "up" as const : "down" as const,
    points: safePoints,
  };
}

function formatChartRate(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value >= 10 ? 2 : 2,
    maximumFractionDigits: value >= 10 ? 3 : 6,
  }).format(value);
}

function formatTooltipDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAxisDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDateAxisLabels(points: ChartPoint[]): string[] {
  if (points.length === 0) {
    return [];
  }

  const labelCount = Math.min(5, points.length);

  return Array.from({ length: labelCount }, (_, index) => {
    const pointIndex =
      labelCount === 1 ? 0 : Math.round((index / (labelCount - 1)) * (points.length - 1));
    return formatAxisDate(points[pointIndex].date);
  });
}

function SparkLine({ data, direction }: { data: ChartPoint[]; direction: "up" | "down" }) {
  const W = 400, H = 120;
  const chartData = data.length > 0 ? data : [{ date: toIsoDate(getLocalToday()), rate: 0 }];
  const min = Math.min(...chartData.map((point) => point.rate));
  const max = Math.max(...chartData.map((point) => point.rate));
  const isFlat = max === min;
  const range = isFlat ? 1 : max - min;
  const xDenominator = Math.max(1, chartData.length - 1);

  const pts = chartData.map((point, i) => ({
    x: (i / xDenominator) * W,
    y: isFlat ? H * 0.5 : H - ((point.rate - min) / range) * (H * 0.82) - H * 0.09,
    point,
  }));

  const polylinePts = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const fillPts = `0,${H} ${polylinePts} ${W},${H}`;
  const color = direction === "up" ? "#34d399" : "#f87171";
  const lastPt = pts[pts.length - 1];

  const [hovered, setHovered] = useState<{
    x: number;
    y: number;
    point: ChartPoint;
  } | null>(null);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // map pixel x to SVG x coordinate
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    // snap to the nearest data point
    let closest = pts[0];
    let minDist = Math.abs(pts[0].x - svgX);
    for (const p of pts) {
      const d = Math.abs(p.x - svgX);
      if (d < minDist) { minDist = d; closest = p; }
    }
    setHovered(closest);
  }

  // tooltip box dimensions
  const TW = 150, TH = 24, TPad = 6;
  const tipX = hovered
    ? Math.min(Math.max(hovered.x - TW / 2, 0), W - TW)
    : 0;
  const tipY = hovered
    ? hovered.y < H * 0.38
      ? H - TH - TPad
      : TPad
    : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-28 cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
    >
      <defs>
        <linearGradient id={`spark-grad-${direction}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <polygon points={fillPts} fill={`url(#spark-grad-${direction})`} />
      <polyline
        points={polylinePts}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* end-of-line dot (hidden while hovering) */}
      {!hovered && (
        <circle
          cx={lastPt.x}
          cy={lastPt.y}
          r="4"
          fill={color}
          stroke="#151a20"
          strokeWidth="2"
        />
      )}

      {/* crosshair + tooltip */}
      {hovered && (
        <>
          {/* vertical crosshair line */}
          <line
            x1={hovered.x} y1={0}
            x2={hovered.x} y2={H}
            stroke={color}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          {/* dot on line */}
          <circle
            cx={hovered.x}
            cy={hovered.y}
            r="4.5"
            fill={color}
            stroke="#151a20"
            strokeWidth="2"
          />
          {/* tooltip bubble */}
          <rect
            x={tipX}
            y={tipY}
            width={TW}
            height={TH}
            rx="4"
            fill="#1e2329"
            stroke={color}
            strokeWidth="0.8"
            opacity="0.95"
          />
          <text
            x={tipX + TW / 2}
            y={tipY + TH / 2 + 4}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {formatChartRate(hovered.point.rate)} {formatTooltipDate(hovered.point.date)}
          </text>
        </>
      )}
    </svg>
  );
}

export default function AnalyticsPage() {
  const [mode, setMode] = useState<AnalyticsMode>("fiat");
  const [selected, setSelected] = useState<PairingCard | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("7D");
  const [cardChartStates, setCardChartStates] = useState<Record<string, ChartState>>({});
  const [chartState, setChartState] = useState<ChartState>({
    status: "idle",
    points: [],
  });

  useEffect(() => {
    const visiblePairings = mode === "fiat" ? FIAT_PAIRINGS : CRYPTO_PAIRINGS;
    const controller = new AbortController();

    setCardChartStates((previous) => {
      const next = { ...previous };
      visiblePairings.forEach((pairing) => {
        next[getPairingKey(mode, pairing.code)] = {
          status: "loading",
          points: [],
          source: mode === "crypto" ? STABLECOIN_HISTORY_SOURCE : "Frankfurter",
        };
      });
      return next;
    });

    visiblePairings.forEach((pairing) => {
      const key = getPairingKey(mode, pairing.code);
      const fallbackPoints = getStaticChartPoints(pairing, "7D");

      fetch(getHistoryUrl(pairing.code, "7D"), { signal: controller.signal })
        .then(async (response) => {
          const payload = (await response.json()) as HistoricalRateResponse;

          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to load historical rates.");
          }

          const points = payload.points;

          if (!points || points.length === 0) {
            throw new Error("The historical rate API returned no chart points.");
          }

          setCardChartStates((previous) => ({
            ...previous,
            [key]: {
              status: "ready",
              points,
              source:
                payload.source ?? (mode === "crypto" ? STABLECOIN_HISTORY_SOURCE : "Frankfurter"),
            },
          }));
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }

          setCardChartStates((previous) => ({
            ...previous,
            [key]: {
              status: "error",
              points: fallbackPoints,
              source: mode === "crypto" ? STABLECOIN_FALLBACK_SOURCE : "Saved fallback",
              error:
                error instanceof Error ? error.message : "Unable to load historical rates.",
            },
          }));
        });
    });

    return () => controller.abort();
  }, [mode]);

  useEffect(() => {
    if (!selected) {
      setChartState({ status: "idle", points: [] });
      return;
    }

    const fallbackPoints = getStaticChartPoints(selected, timeframe);

    const controller = new AbortController();
    setChartState({
      status: "loading",
      points: [],
      source: mode === "crypto" ? STABLECOIN_HISTORY_SOURCE : "Frankfurter",
    });

    fetch(getHistoryUrl(selected.code, timeframe), { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as HistoricalRateResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load historical rates.");
        }

        if (!payload.points || payload.points.length === 0) {
          throw new Error("The historical rate API returned no chart points.");
        }

        setChartState({
          status: "ready",
          points: payload.points,
          source: payload.source ?? "Frankfurter",
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        setChartState({
          status: "error",
          points: fallbackPoints,
          source: mode === "crypto" ? STABLECOIN_FALLBACK_SOURCE : "Saved fallback",
          error: error instanceof Error ? error.message : "Unable to load historical rates.",
        });
      });

    return () => controller.abort();
  }, [mode, selected, timeframe]);

  function openChart(pairing: PairingCard) {
    const initialTimeframe = "7D";
    setTimeframe(initialTimeframe);
    setSelected(pairing);
    setChartState({
      status: "loading",
      points: [],
      source: mode === "crypto" ? STABLECOIN_HISTORY_SOURCE : "Frankfurter",
    });
  }

  function handleTimeframeChange(nextTimeframe: Timeframe) {
    setTimeframe(nextTimeframe);

    if (!selected) {
      return;
    }

    setChartState({
      status: "loading",
      points: [],
      source: mode === "crypto" ? STABLECOIN_HISTORY_SOURCE : "Frankfurter",
    });
  }

  const pairings = mode === "fiat" ? FIAT_PAIRINGS : CRYPTO_PAIRINGS;
  const selectedStats =
    selected && chartState.points.length > 0 ? getStatsFromChartPoints(chartState.points) : null;
  const axisLabels = getDateAxisLabels(chartState.points);
  const title =
    mode === "fiat"
      ? "Popular US Dollar (USD) Fiat Pairings"
      : "Popular USD Stablecoin Pairings";
  const baseLabel = mode === "fiat" ? "1 USD equals to" : "Indicative route quote";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0b0e11" }}>
      <Nav />

      <main className="flex-1">
        <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-5 border-b border-[#1e2329] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Market analytics
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
            </div>

            <div className="w-full rounded-xl border border-[#2b3139] bg-[#151a20] p-1.5 sm:w-auto">
              <div className="relative grid h-10 w-full grid-cols-2 rounded-lg border border-[#2b3139] bg-[#0b0e11] p-1 sm:w-64">
                <span
                  className={
                    "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-md bg-cyan-500/20 ring-1 ring-cyan-400/30 transition-transform duration-200 " +
                    (mode === "crypto" ? "translate-x-full" : "translate-x-0")
                  }
                />
                <button
                  type="button"
                  onClick={() => setMode("fiat")}
                  className={
                    "relative z-10 rounded-md px-3 text-sm font-bold transition-colors " +
                    (mode === "fiat" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                  }
                >
                  Fiat
                </button>
                <button
                  type="button"
                  onClick={() => setMode("crypto")}
                  className={
                    "relative z-10 rounded-md px-3 text-sm font-bold transition-colors " +
                    (mode === "crypto" ? "text-cyan-300" : "text-[#848e9c] hover:text-white")
                  }
                >
                  Crypto
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pairings.map((pairing) => {
              const cardChartState = cardChartStates[getPairingKey(mode, pairing.code)];
              const cardStats =
                cardChartState?.points.length
                  ? getStatsFromChartPoints(cardChartState.points)
                  : getPairingStats(pairing, "7D");

              return (
                <article
                  key={`${mode}-${pairing.name}`}
                  className="rounded-xl border border-[#1e2329] bg-[#151a20] p-5 shadow-lg shadow-black/20 transition-colors hover:border-cyan-500/30 sm:p-6"
                >
                  <div className="flex items-center gap-3">
                    <CurrencyIcon code={pairing.code} />
                    <h2 className="font-semibold text-white">{pairing.name}</h2>
                  </div>

                  <p className="mt-8 text-sm text-[#9aa4b2]">{baseLabel}</p>
                  <p className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {cardStats.currentText} {pairing.code}
                  </p>

                  <p
                    className={
                      "mt-3 text-sm font-medium " +
                      (cardStats.direction === "up" ? "text-emerald-400" : "text-red-400")
                    }
                  >
                    {cardStats.rangeChangeText} ({cardStats.rangePercentText}){" "}
                    <span className="text-[#9aa4b2]">7D</span>
                  </p>

                  <button
                    type="button"
                    onClick={() => openChart(pairing)}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    View chart
                    <BarChart2 className="h-4 w-4" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </main>

      {/* Chart popup */}
      <Dialog.Root open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#2b3139] bg-[#151a20] p-4 shadow-2xl focus:outline-none sm:w-full sm:p-6">
            {selected && (
              <>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <CurrencyIcon code={selected.code} />
                    <div>
                      <Dialog.Title className="font-bold text-white">
                        {selected.name}
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-[#848e9c]">
                        USD / {selected.code} - {TIMEFRAME_TITLE[timeframe]} overview
                      </Dialog.Description>
                    </div>
                  </div>
                  <Dialog.Close className="rounded-lg p-1 text-[#848e9c] transition-colors hover:bg-[#1e2329] hover:text-white">
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>

                {/* Current rate */}
                <div className="mt-5">
                  <p className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {selectedStats?.currentText ?? "Loading"}{" "}
                    <span className="text-xl text-[#848e9c]">{selected.code}</span>
                  </p>
                  <p
                    className={
                      "mt-1 text-sm font-medium " +
                      (selectedStats?.direction === "down" ? "text-red-400" : "text-emerald-400")
                    }
                  >
                    {selectedStats
                      ? `${selectedStats.rangeChangeText} (${selectedStats.rangePercentText})`
                      : "Loading historical rates"}{" "}
                    <span className="text-[#848e9c]">{TIMEFRAME_TITLE[timeframe]}</span>
                  </p>
                </div>

                {/* Timeframe switcher */}
                <div className="mt-4 flex gap-1 rounded-lg border border-[#2b3139] bg-[#0b0e11] p-1">
                  {(["7D", "30D", "90D", "1Y"] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => handleTimeframeChange(tf)}
                      className={
                        "flex-1 rounded-md py-1.5 text-xs font-bold transition-colors " +
                        (timeframe === tf
                          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30"
                          : "text-[#848e9c] hover:text-white")
                      }
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                {/* Sparkline chart */}
                <div className="mt-3 overflow-hidden rounded-xl border border-[#2b3139] bg-[#0b0e11] px-4 pb-2 pt-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#848e9c]">
                      Historical Rate ({TIMEFRAME_TITLE[timeframe]})
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4b5563]">
                      {chartState.status === "loading"
                        ? "Loading API"
                        : chartState.source ?? "Chart data"}
                    </span>
                  </div>
                  {chartState.status === "error" && (
                    <p className="mb-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                      {chartState.error} Showing saved sample data.
                    </p>
                  )}
                  {selectedStats ? (
                    <>
                      <SparkLine data={selectedStats.points} direction={selectedStats.direction} />
                      <div className="flex justify-between pb-1 text-[10px] text-[#4b5563]">
                        {axisLabels.map((label, index) => (
                          <span key={`${label}-${index}`}>{label}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#2b3139] text-xs font-semibold uppercase tracking-wider text-[#848e9c]">
                      Loading chart
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-3">
                    <p className="text-[11px] text-[#848e9c]">Current</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {selectedStats?.currentText ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-3">
                    <p className="text-[11px] text-[#848e9c]">Range High</p>
                    <p className="mt-1 text-sm font-bold text-emerald-400">
                      {selectedStats?.high ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-3">
                    <p className="text-[11px] text-[#848e9c]">Range Low</p>
                    <p className="mt-1 text-sm font-bold text-red-400">
                      {selectedStats?.low ?? "--"}
                    </p>
                  </div>
                </div>

                {/* View Route CTA */}
                <Link
                  href={`/routes?from=USD&to=${selected.code}&amount=1000&mode=${
                    mode === "fiat" ? "fiat_only" : "all"
                  }`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-[#0b0e11] transition-colors hover:bg-cyan-400"
                >
                  View Route
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <footer className="border-t border-[#1e2329] py-4">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <div className="flex items-center gap-2">
            <CircleDot className="h-3 w-3 text-[#848e9c]" />
            <span className="text-xs text-[#848e9c]">
              Designed and built by Kirill Delyukin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/SDM-Logo.svg" alt="SDM" width={14} height={15} />
            <span className="text-xs text-[#848e9c]">SDM (c) 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CurrencyIcon({ code }: { code: string }) {
  const flag = getCurrencyFlag(code);

  if (flag) {
    return (
      <Image
        src={flag}
        alt=""
        width={34}
        height={34}
        className="h-[34px] w-[34px] rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
      <LineChart className="h-4 w-4" />
    </span>
  );
}
