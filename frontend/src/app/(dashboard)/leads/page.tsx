"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Lead } from "@/types";

const SOURCE_COLORS: Record<string, string> = {
  instagram: "bg-pink-900 text-pink-300",
  whatsapp: "bg-green-900 text-green-300",
  link_bio: "bg-blue-900 text-blue-300",
  manual: "bg-gray-700 text-gray-300",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    api.get("/api/v1/leads/").then((r) => setLeads(r.data));
  }, []);

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Email", "Origem", "Tags", "Data"];
    const rows = leads.map((l) => [
      l.name, l.phone, l.email ?? "", l.source, l.tags.join(";"),
      new Date(l.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">CRM de Leads</h1>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-sm transition"
        >
          Exportar CSV
        </button>
      </div>
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-700">
            <tr className="text-gray-400">
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Telefone</th>
              <th className="text-left px-4 py-3">Origem</th>
              <th className="text-left px-4 py-3">Tags</th>
              <th className="text-left px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 text-gray-300">
                <td className="px-4 py-3">{lead.name}</td>
                <td className="px-4 py-3">{lead.phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${SOURCE_COLORS[lead.source]}`}>
                    {lead.source}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-gray-700 text-xs">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhum lead encontrado</p>
        )}
      </div>
    </div>
  );
}
