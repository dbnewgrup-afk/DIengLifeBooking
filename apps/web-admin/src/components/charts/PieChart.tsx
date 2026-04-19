"use client";

import * as React from "react";
import {
  PieChart as RPieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * Karena tidak menentukan warna spesifik, kita pakai array kelas text-color
 * lalu mapping ke "currentColor" via wrapper <span className="text-...">.
 * Komponen ini merender <span> pembungkus agar tiap slice bisa beda tone
 * tanpa hardcode warna HEX.
 */

const TONES = [
  "text-slate-900",
  "text-emerald-700",
  "text-sky-700",
  "text-indigo-700",
  "text-rose-700",
  "text-amber-700",
  "text-teal-700",
  "text-fuchsia-700",
];

export type PieChartProps<T extends Record<string, any>> = {
  data: T[];
  nameKey: keyof T & string;
  valueKey: keyof T & string;
  /** ring: 0 artinya pie penuh; >0 jadi donut */
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  valueFormatter?: (v: any) => string;
  className?: string;
};

export default function PieChart<T extends Record<string, any>>({
  data,
  nameKey,
  valueKey,
  innerRadius = 40,
  outerRadius = 80,
  height = 280,
  valueFormatter,
  className,
}: PieChartProps<T>) {
  return (
    <div className={["rounded-xl border border-slate-200 bg-white p-3", className].filter(Boolean).join(" ")}>
      <div className="h-[--chart-h]" style={{ ["--chart-h" as any]: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart>
            <Tooltip formatter={(v: any) => (valueFormatter ? valueFormatter(v) : String(v))} />
            <Legend />
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey={nameKey}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="currentColor"
              fill="currentColor"
              isAnimationActive={false}
              label
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill="currentColor" className={TONES[idx % TONES.length]} />
              ))}
            </Pie>
          </RPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
