"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Zap } from "lucide-react";
import api from "@/lib/api";
import { Automation, FlowJSON } from "@/types";
import NewAutomationModal from "@/components/flow-builder/NewAutomationModal";

const FlowCanvas = dynamic(() => import("@/components/flow-builder/FlowCanvas"), { ssr: false });

const TRIGGER_LABELS: Record<string, string> = {
  keyword_whatsapp: "Palavra-chave no WhatsApp",
  keyword_instagram: "Palavra-chave no Instagram DM",
};

export default function AutomacoesPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => api.get("/api/v1/automations/").then((r) => setAutomations(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => {
    await api.post(`/api/v1/automations/${id}/toggle`);
    load();
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Remover esta automação?")) return;
    await api.delete(`/api/v1/automations/${id}`);
    load();
  };

  const createAutomation = async (name: string, trigger: string, keyword: string) => {
    const channel = trigger.includes("instagram") ? "instagram" : "whatsapp";
    const res = await api.post("/api/v1/automations/", {
      name,
      trigger_type: trigger,
      trigger_config: { keyword, channel },
      flow_json: {
        nodes: [{ id: "t1", type: "TriggerNode", position: { x: 250, y: 80 }, data: { channel, keyword } }],
        edges: [],
      },
      active: false,
    });
    setShowNew(false);
    setEditing(res.data);
    load();
  };

  const saveFlow = async (flow: FlowJSON) => {
    if (!editing) return;
    await api.put(`/api/v1/automations/${editing.id}`, { ...editing, flow_json: flow });
    setEditing(null);
    load();
  };

  if (editing) {
    return (
      <div className="flex flex-col h-[calc(100vh-48px)] space-y-3">
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white text-sm transition">← Voltar</button>
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-400" />
            <h2 className="text-white font-semibold">{editing.name}</h2>
            <span className="text-xs text-gray-500">{TRIGGER_LABELS[editing.trigger_type]}</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <FlowCanvas initialFlow={editing.flow_json} onSave={saveFlow} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Automações</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
        >
          <Plus size={16} /> Nova Automação
        </button>
      </div>

      <div className="space-y-3">
        {automations.map((a) => (
          <div key={a.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white font-medium">{a.name}</p>
              <p className="text-gray-400 text-sm">{TRIGGER_LABELS[a.trigger_type] ?? a.trigger_type}</p>
              {a.trigger_config?.keyword && (
                <p className="text-xs text-gray-500">Palavra-chave: <span className="font-mono text-gray-400">"{a.trigger_config.keyword}"</span></p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-xs ${a.active ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                {a.active ? "Ativo" : "Inativo"}
              </span>
              <button onClick={() => toggle(a.id)} className="text-sm text-gray-400 hover:text-white transition">
                {a.active ? "Pausar" : "Ativar"}
              </button>
              <button onClick={() => setEditing(a)} className="text-sm text-indigo-400 hover:text-indigo-300 transition">
                Editar fluxo
              </button>
              <button onClick={() => deleteAutomation(a.id)} className="text-sm text-red-500 hover:text-red-400 transition">
                Remover
              </button>
            </div>
          </div>
        ))}
        {automations.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Zap size={40} className="text-gray-700 mx-auto" />
            <p className="text-gray-400">Nenhuma automação criada ainda</p>
            <button onClick={() => setShowNew(true)} className="text-indigo-400 hover:text-indigo-300 text-sm underline">
              Criar primeira automação
            </button>
          </div>
        )}
      </div>

      {showNew && <NewAutomationModal onConfirm={createAutomation} onClose={() => setShowNew(false)} />}
    </div>
  );
}
