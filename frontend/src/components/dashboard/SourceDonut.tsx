"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SourceDonutProps {
  data: { source: string; count: number }[];
}

const COLORS = ["#6366f1", "#34d399", "#f59e0b", "#e879f9"];

export default function SourceDonut({ data }: SourceDonutProps) {
  const chartData = data.map((d) => ({ name: d.source, value: d.count }));
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-white font-semibold mb-4">Origem dos Leads</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#1f2937", border: "none", color: "#fff" }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
