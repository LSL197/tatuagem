import { Handle, Position } from "@xyflow/react";
import { Clock } from "lucide-react";

export default function DelayNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const amount = data.amount as number;
  const unit = data.unit as string;
  const unitLabels: Record<string, string> = { minutes: "minuto(s)", hours: "hora(s)", days: "dia(s)" };

  return (
    <div className={`rounded-xl px-4 py-3 min-w-48 border-2 transition-all ${selected ? "border-cyan-400 shadow-lg shadow-cyan-500/20" : "border-cyan-700"} bg-cyan-950`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-cyan-700 flex items-center justify-center">
          <Clock size={12} className="text-white" />
        </div>
        <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wide">Aguardar</span>
      </div>
      <p className="text-white text-sm font-medium">
        {amount ? `${amount} ${unitLabels[unit] ?? "minuto(s)"}` : "Clique para configurar..."}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3" />
    </div>
  );
}
