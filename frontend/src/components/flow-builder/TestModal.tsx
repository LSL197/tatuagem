"use client";

import { useState } from "react";
import { X, Play, CheckCircle, XCircle } from "lucide-react";
import { FlowJSON } from "@/types";

interface Props {
  flow: FlowJSON;
  onClose: () => void;
}

interface StepResult {
  nodeId: string;
  type: string;
  status: "ok" | "error" | "skipped";
  message: string;
}

function simulateFlow(flow: FlowJSON, testMessage: string): StepResult[] {
  const results: StepResult[] = [];
  const nodeMap = Object.fromEntries(flow.nodes.map((n) => [n.id, n]));
  const edgeMap: Record<string, string[]> = {};
  for (const e of flow.edges) {
    if (!edgeMap[e.source]) edgeMap[e.source] = [];
    edgeMap[e.source].push(e.target);
  }

  const trigger = flow.nodes.find((n) => n.type === "TriggerNode");
  if (!trigger) {
    return [{ nodeId: "none", type: "system", status: "error", message: "Nenhum nó de gatilho encontrado." }];
  }

  const keyword = (trigger.data as Record<string, unknown>).keyword as string;
  const triggered = testMessage.toLowerCase().includes((keyword ?? "").toLowerCase());

  results.push({
    nodeId: trigger.id,
    type: "TriggerNode",
    status: triggered ? "ok" : "error",
    message: triggered ? `Palavra-chave "${keyword}" encontrada na mensagem.` : `Palavra-chave "${keyword}" NÃO encontrada. Fluxo não seria disparado.`,
  });

  if (!triggered) return results;

  const visit = (nodeId: string) => {
    const node = nodeMap[nodeId];
    if (!node || node.type === "TriggerNode") return;
    const data = node.data as Record<string, unknown>;

    if (node.type === "MessageNode") {
      results.push({ nodeId: node.id, type: "MessageNode", status: "ok", message: `Envia mensagem: "${data.message}"` });
    } else if (node.type === "DelayNode") {
      results.push({ nodeId: node.id, type: "DelayNode", status: "ok", message: `Aguarda ${data.amount} ${data.unit}.` });
    } else if (node.type === "ActionNode") {
      const labels: Record<string, string> = { save_lead: "Salvar Lead", create_appointment: "Criar Agendamento", send_booking_link: "Enviar Link /book", notify_artist: "Notificar Tatuador" };
      results.push({ nodeId: node.id, type: "ActionNode", status: "ok", message: `Executa ação: ${labels[data.action as string] ?? data.action}` });
    } else if (node.type === "AIAgentNode") {
      results.push({ nodeId: node.id, type: "AIAgentNode", status: "ok", message: `Aciona agente IA: ${data.agent_type === "consultant" ? "Consultor de Ideias" : "Qualificação de Lead"}` });
    } else if (node.type === "ConditionNode") {
      const val = (data.value as string ?? "").toLowerCase();
      const cond = data.condition as string;
      const msg = testMessage.toLowerCase();
      const match = cond === "equals" ? msg === val : cond === "starts_with" ? msg.startsWith(val) : msg.includes(val);
      results.push({ nodeId: node.id, type: "ConditionNode", status: "ok", message: `Condição avaliada: ${match ? "✓ Sim (caminho verde)" : "✗ Não (caminho vermelho)"}` });
      const nexts = edgeMap[node.id] ?? [];
      for (const next of nexts) visit(next);
      return;
    }

    const nexts = edgeMap[node.id] ?? [];
    for (const next of nexts) visit(next);
  };

  const nexts = edgeMap[trigger.id] ?? [];
  for (const next of nexts) visit(next);

  return results;
}

export default function TestModal({ flow, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<StepResult[] | null>(null);

  const run = () => setResults(simulateFlow(flow, message));

  const TYPE_LABELS: Record<string, string> = {
    TriggerNode: "Gatilho", MessageNode: "Mensagem", ConditionNode: "Condição",
    DelayNode: "Aguardar", ActionNode: "Ação", AIAgentNode: "Agente IA", system: "Sistema",
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Testar Automação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Telefone de teste</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 11 99999-9999"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Mensagem simulada</label>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="ex: quero tatuar"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <button onClick={run} disabled={!message.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition disabled:opacity-40">
            <Play size={14} /> Simular execução
          </button>
        </div>

        {results && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Resultado da simulação</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${r.status === "ok" ? "border-green-800 bg-green-950/50" : "border-red-800 bg-red-950/50"}`}>
                  {r.status === "ok" ? <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" /> : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{TYPE_LABELS[r.type] ?? r.type}</p>
                    <p className="text-sm text-white">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition">
          Fechar
        </button>
      </div>
    </div>
  );
}
