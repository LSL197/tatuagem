import { Handle, Position } from "@xyflow/react";
import { MessageSquare } from "lucide-react";

export default function MessageNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const message = data.message as string;

  return (
    <div className={`rounded-xl px-4 py-3 min-w-52 max-w-72 border-2 transition-all ${selected ? "border-green-400 shadow-lg shadow-green-500/20" : "border-green-700"} bg-green-950`}>
      <Handle type="target" position={Position.Top} className="!bg-green-400 !w-3 !h-3" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-green-700 flex items-center justify-center">
          <MessageSquare size={12} className="text-white" />
        </div>
        <span className="text-green-300 text-xs font-semibold uppercase tracking-wide">Mensagem</span>
      </div>
      <p className="text-white text-sm line-clamp-3">{message || "Clique para configurar..."}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400 !w-3 !h-3" />
    </div>
  );
}
