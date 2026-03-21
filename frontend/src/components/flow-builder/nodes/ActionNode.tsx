import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  save_lead: "Salvar Lead",
  create_appointment: "Criar Agendamento",
  send_booking_link: "Enviar Link /book",
  notify_artist: "Notificar Tatuador",
};

export default function ActionNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const action = data.action as string;

  return (
    <div className={`rounded-xl px-4 py-3 min-w-48 border-2 transition-all ${selected ? "border-yellow-400 shadow-lg shadow-yellow-500/20" : "border-yellow-700"} bg-yellow-950`}>
      <Handle type="target" position={Position.Top} className="!bg-yellow-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-yellow-700 flex items-center justify-center">
          <Zap size={12} className="text-white" />
        </div>
        <span className="text-yellow-300 text-xs font-semibold uppercase tracking-wide">Ação</span>
      </div>
      <p className="text-white text-sm font-medium">{ACTION_LABELS[action] ?? "Selecione uma ação"}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400 !w-3 !h-3" />
    </div>
  );
}
