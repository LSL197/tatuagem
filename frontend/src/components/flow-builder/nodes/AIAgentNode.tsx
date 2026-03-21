import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";

const AGENT_LABELS: Record<string, string> = {
  consultant: "Consultor de Ideias",
  qualifier: "Qualificação de Lead",
};

export default function AIAgentNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const agentType = data.agent_type as string;

  return (
    <div className={`rounded-xl px-4 py-3 min-w-48 border-2 transition-all ${selected ? "border-purple-400 shadow-lg shadow-purple-500/20" : "border-purple-700"} bg-purple-950`}>
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-purple-700 flex items-center justify-center">
          <Bot size={12} className="text-white" />
        </div>
        <span className="text-purple-300 text-xs font-semibold uppercase tracking-wide">Agente IA</span>
      </div>
      <p className="text-white text-sm font-medium">{AGENT_LABELS[agentType] ?? "Selecione o agente"}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3" />
    </div>
  );
}
