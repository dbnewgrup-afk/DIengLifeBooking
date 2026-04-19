"use client";

import * as React from "react";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type BarSeries = {
  dataKey: string;
  name?: string;
  stackId?: string | number;
};

export type BarChartProps<T extends Record<string, any>> = {
  data: T[];
  xKey: keyof T & string;
  series: BarSeries[];
  xFormatter?: (v: any) => string;
  yFormatter?: (v: any) => string;
  height?: number;
  className?: string;
};

export default function BarChart<T extends Record<string, any>>({
  data,
  xKey,
  series,
  xFormatter,
  yFormatter,
  height = 280,
  className,
}: BarChartProps<T>) {
  return (
    <div className={["rounded-xl border border-slate-200 bg-white p-3", className].filter(Boolean).join(" ")}>
      <div className="h-[--chart-h]" style={{ ["--chart-h" as any]: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tickFormatter={xFormatter} />
            <YAxis tickFormatter={yFormatter} width={56} />
            <Tooltip
              labelFormatter={xFormatter}
              formatter={(value: any) => (yFormatter ? yFormatter(value) : String(value))}
            />
            <Legend />
            {series.map((s, idx) => (
              <Bar
                key={s.dataKey || idx}
                dataKey={s.dataKey}
                name={s.name}
                stackId={s.stackId as any}
                fill="currentColor"
                isAnimationActive={false}
              />
            ))}
          </RBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
