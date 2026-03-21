"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface Report {
  revenue: number;
  commissions: number;
  expenses: number;
  profit: number;
  by_artist: { artist_id: string; name: string; sessions: number; revenue: number; commission: number }[];
}

export default function FinanceiroPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.get(`/api/v1/financial/report?period=month&date=${month}`).then((r) => setReport(r.data));
  }, [month]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Financeiro</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Bruta", value: report?.revenue ?? 0 },
          { label: "Comissões", value: report?.commissions ?? 0 },
          { label: "Despesas", value: report?.expenses ?? 0 },
          { label: "Lucro Líquido", value: report?.profit ?? 0 },
        ].map((item) => (
          <div key={item.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">{item.label}</p>
            <p className="text-white text-xl font-bold">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {report && report.by_artist.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Por Tatuador</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-2">Nome</th>
                <th className="text-right pb-2">Sessões</th>
                <th className="text-right pb-2">Receita</th>
                <th className="text-right pb-2">Comissão</th>
              </tr>
            </thead>
            <tbody>
              {report.by_artist.map((a) => (
                <tr key={a.artist_id} className="text-gray-300 border-b border-gray-700/50">
                  <td className="py-2">{a.name}</td>
                  <td className="text-right py-2">{a.sessions}</td>
                  <td className="text-right py-2">{formatCurrency(a.revenue)}</td>
                  <td className="text-right py-2">{formatCurrency(a.commission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
