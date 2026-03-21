"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface LeadsChartProps {
  data: { date: string; value: number; channel: string }[];
}

export default function LeadsChart({ data }: LeadsChartProps) {
  const grouped: Record<string, Record<string, number>> = {};
  for (const d of data) {
    if (!grouped[d.date]) grouped[d.date] = {};
    grouped[d.date][d.channel] = (grouped[d.date][d.channel] || 0) + d.value;
  }
  const chartData = Object.entries(grouped).map(([date, channels]) => ({ date, ...channels }));

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-white font-semibold mb-4">Leads por Canal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1f2937", border: "none", color: "#fff" }} />
          <Legend />
          <Line type="monotone" dataKey="instagram" stroke="#e879f9" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="whatsapp" stroke="#34d399" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="link_bio" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
