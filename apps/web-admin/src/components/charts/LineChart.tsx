"use client";

import * as React from "react";
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type LineSeries = {
  dataKey: string;
  name?: string;
  /** Jika true, area kecil di bawah garis diisi tipis */
  fill?: boolean;
};

export type LineChartProps<T extends Record<string, any>> = {
  data: T[];
  /** key untuk sumbu-X, misal "date" atau "label" */
  xKey: keyof T & string;
  /** daftar seri, misal [{dataKey:"revenue"},{dataKey:"orders"}] */
  series: LineSeries[];
  /** formatter label X */
  xFormatter?: (v: any) => string;
  /** formatter nilai Y */
  yFormatter?: (v: any) => string;
  /** tinggi container */
  height?: number;
  className?: string;
};

export default function LineChart<T extends Record<string, any>>({
  data,
  xKey,
  series,
  xFormatter,
  yFormatter,
  height = 280,
  className,
}: LineChartProps<T>) {
  return (
    <div className={["rounded-xl border border-slate-200 bg-white p-3", className].filter(Boolean).join(" ")}>
      <div className="h-[--chart-h]" style={{ ["--chart-h" as any]: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RLineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tickFormatter={xFormatter} />
            <YAxis tickFormatter={yFormatter} width={56} />
            <Tooltip
              labelFormatter={xFormatter}
              formatter={(value: any) => (yFormatter ? yFormatter(value) : String(value))}
            />
            <Legend />
            {series.map((s, idx) => (
              <Line
                key={s.dataKey || idx}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke="currentColor"
                fill={s.fill ? "currentColor" : undefined}
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </RLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
