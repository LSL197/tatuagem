"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import KPICard from "@/components/dashboard/KPICard";
import LeadsChart from "@/components/dashboard/LeadsChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import SourceDonut from "@/components/dashboard/SourceDonut";
import BookingHeatmap from "@/components/dashboard/BookingHeatmap";
import { formatCurrency } from "@/lib/utils";

const PERIODS = ["today", "week", "month", "quarter"] as const;
const PERIOD_LABELS: Record<string, string> = {
  today: "Hoje",
  week: "Semana",
  month: "Mês",
  quarter: "Trimestre",
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<string>("month");
  const [kpis, setKpis] = useState<{ leads: number; appointments: number; avg_ticket: number; flows_triggered: number } | null>(null);
  const [leadsData, setLeadsData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [topArtists, setTopArtists] = useState<{ name: string; revenue: number; sessions: number; avg_ticket: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [k, l, r, s, h, a] = await Promise.all([
        api.get(`/api/v1/metrics/kpis?period=${period}`),
        api.get(`/api/v1/metrics/leads-over-time?period=${period}`),
        api.get(`/api/v1/metrics/revenue?period=${period}`),
        api.get(`/api/v1/metrics/leads-by-source?period=${period}`),
        api.get(`/api/v1/metrics/booking-heatmap?period=${period}`),
        api.get(`/api/v1/metrics/top-artists?period=${period}`),
      ]);
      setKpis(k.data);
      setLeadsData(l.data);
      setRevenueData(r.data);
      setSourceData(s.data);
      setHeatmapData(h.data);
      setTopArtists(a.data);
    };
    load();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                period === p ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total de Leads" value={kpis?.leads ?? 0} />
        <KPICard title="Agendamentos" value={kpis?.appointments ?? 0} />
        <KPICard title="Ticket Médio" value={kpis?.avg_ticket ?? 0} isCurrency />
        <KPICard title="Fluxos Disparados" value={kpis?.flows_triggered ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadsChart data={leadsData} />
        <RevenueChart data={revenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SourceDonut data={sourceData} />
        <BookingHeatmap data={heatmapData} />
      </div>

      {topArtists.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Ranking de Tatuadores</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-2">Tatuador</th>
                <th className="text-right pb-2">Sessões</th>
                <th className="text-right pb-2">Faturamento</th>
                <th className="text-right pb-2">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {topArtists.map((a, i) => (
                <tr key={i} className="text-gray-300 border-b border-gray-700/50">
                  <td className="py-2">{a.name}</td>
                  <td className="text-right py-2">{a.sessions}</td>
                  <td className="text-right py-2">{formatCurrency(a.revenue)}</td>
                  <td className="text-right py-2">{formatCurrency(a.avg_ticket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
