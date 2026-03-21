import { Handle, Position } from "@xyflow/react";
import { Zap } from "lucide-react";

export default function TriggerNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const channel = data.channel as string;
  const keyword = data.keyword as string;

  return (
    <div className={`rounded-xl px-4 py-3 min-w-52 border-2 transition-all ${selected ? "border-indigo-400 shadow-lg shadow-indigo-500/20" : "border-indigo-600"} bg-indigo-950`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <Zap size={12} className="text-white" />
        </div>
        <span className="text-indigo-300 text-xs font-semibold uppercase tracking-wide">Gatilho</span>
      </div>
      <p className="text-white text-sm font-medium">{channel === "instagram" ? "Instagram DM" : channel === "whatsapp" ? "WhatsApp" : "Selecione canal"}</p>
      {keyword && <p className="text-indigo-300 text-xs mt-1">Palavra: <span className="text-white font-mono">"{keyword}"</span></p>}
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400 !w-3 !h-3" />
    </div>
  );
}
