"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/format";

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutProps {
  data: DonutDatum[];
  centerLabel?: string;
  centerSubLabel?: string;
}

export function Donut({ data, centerLabel, centerSubLabel }: DonutProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data to display
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value) => formatMoney(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold tracking-tight">
          {centerLabel ?? formatMoney(total)}
        </p>
        {centerSubLabel ? (
          <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
            {centerSubLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
