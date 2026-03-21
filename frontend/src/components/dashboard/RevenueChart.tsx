"use client";

import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ComposedChart, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  data: { period: string; revenue: number; profit: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-white font-semibold mb-4">Faturamento</h3>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data}>
          <XAxis dataKey="period" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1f2937", border: "none", color: "#fff" }} />
          <Legend />
          <Bar dataKey="revenue" name="Receita" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="profit" name="Lucro" stroke="#34d399" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
