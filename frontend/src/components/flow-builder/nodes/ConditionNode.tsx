import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export default function ConditionNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const value = data.value as string;
  const condition = data.condition as string;
  const conditionLabels: Record<string, string> = { contains: "contém", equals: "é igual a", starts_with: "começa com" };

  return (
    <div className={`rounded-xl px-4 py-3 min-w-52 border-2 transition-all ${selected ? "border-orange-400 shadow-lg shadow-orange-500/20" : "border-orange-700"} bg-orange-950`}>
      <Handle type="target" position={Position.Top} className="!bg-orange-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-orange-700 flex items-center justify-center">
          <GitBranch size={12} className="text-white" />
        </div>
        <span className="text-orange-300 text-xs font-semibold uppercase tracking-wide">Condição</span>
      </div>
      <p className="text-white text-sm">
        Resposta {conditionLabels[condition] ?? "contém"}{" "}
        {value ? <span className="font-mono text-orange-200">"{value}"</span> : <span className="text-orange-400">...</span>}
      </p>
      <div className="flex justify-between mt-3 text-xs">
        <span className="text-green-400 font-medium">✓ Sim</span>
        <span className="text-red-400 font-medium">✗ Não</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="yes" style={{ left: "30%" }} className="!bg-green-400 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} id="no" style={{ left: "70%" }} className="!bg-red-400 !w-3 !h-3" />
    </div>
  );
}
