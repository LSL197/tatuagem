"use client";

import { useState, useCallback, useRef } from "react";
import {
  ReactFlow, addEdge, useNodesState, useEdgesState,
  Connection, Background, Controls, MiniMap, Node,
  ReactFlowProvider, ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Save, Play, Code, Eye, Zap, MessageSquare, GitBranch, Clock, Bot, ChevronRight } from "lucide-react";
import TriggerNode from "./nodes/TriggerNode";
import MessageNode from "./nodes/MessageNode";
import ConditionNode from "./nodes/ConditionNode";
import DelayNode from "./nodes/DelayNode";
import ActionNode from "./nodes/ActionNode";
import AIAgentNode from "./nodes/AIAgentNode";
import NodeConfig from "./NodeConfig";
import TestModal from "./TestModal";
import { FlowJSON } from "@/types";

const nodeTypes = { TriggerNode, MessageNode, ConditionNode, DelayNode, ActionNode, AIAgentNode };

const PALETTE = [
  { type: "TriggerNode", label: "Gatilho", icon: Zap, color: "indigo", defaultData: { channel: "whatsapp", keyword: "" } },
  { type: "MessageNode", label: "Mensagem", icon: MessageSquare, color: "green", defaultData: { message: "" } },
  { type: "ConditionNode", label: "Condição", icon: GitBranch, color: "orange", defaultData: { condition: "contains", value: "" } },
  { type: "DelayNode", label: "Aguardar", icon: Clock, color: "cyan", defaultData: { amount: 5, unit: "minutes" } },
  { type: "ActionNode", label: "Ação", icon: Zap, color: "yellow", defaultData: { action: "save_lead" } },
  { type: "AIAgentNode", label: "Agente IA", icon: Bot, color: "purple", defaultData: { agent_type: "consultant" } },
];

const COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-600", green: "bg-green-700", orange: "bg-orange-700",
  cyan: "bg-cyan-700", yellow: "bg-yellow-700", purple: "bg-purple-700",
};

const TEMPLATES: { name: string; flow: FlowJSON }[] = [
  {
    name: "Auto-reply + Link",
    flow: {
      nodes: [
        { id: "t1", type: "TriggerNode", position: { x: 250, y: 50 }, data: { channel: "whatsapp", keyword: "quero tatuar" } },
        { id: "m1", type: "MessageNode", position: { x: 250, y: 200 }, data: { message: "Olá! Que bom que quer tatuar 🎨 Veja nossos artistas e agende:" } },
        { id: "a1", type: "ActionNode", position: { x: 250, y: 360 }, data: { action: "send_booking_link" } },
        { id: "a2", type: "ActionNode", position: { x: 250, y: 480 }, data: { action: "save_lead" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "a1" },
        { id: "e3", source: "a1", target: "a2" },
      ],
    },
  },
  {
    name: "Qualificação com IA",
    flow: {
      nodes: [
        { id: "t1", type: "TriggerNode", position: { x: 250, y: 50 }, data: { channel: "instagram", keyword: "tattoo" } },
        { id: "a1", type: "ActionNode", position: { x: 250, y: 200 }, data: { action: "save_lead" } },
        { id: "ai1", type: "AIAgentNode", position: { x: 250, y: 340 }, data: { agent_type: "qualifier" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "a1" },
        { id: "e2", source: "a1", target: "ai1" },
      ],
    },
  },
  {
    name: "Confirmação com delay",
    flow: {
      nodes: [
        { id: "t1", type: "TriggerNode", position: { x: 250, y: 50 }, data: { channel: "whatsapp", keyword: "confirmado" } },
        { id: "m1", type: "MessageNode", position: { x: 250, y: 200 }, data: { message: "Perfeito! Seu agendamento está confirmado. Até logo! 🖤" } },
        { id: "d1", type: "DelayNode", position: { x: 250, y: 360 }, data: { amount: 2, unit: "hours" } },
        { id: "m2", type: "MessageNode", position: { x: 250, y: 490 }, data: { message: "Lembrete: sua sessão é amanhã. Qualquer dúvida é só chamar!" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "d1" },
        { id: "e3", source: "d1", target: "m2" },
      ],
    },
  },
];

interface Props {
  initialFlow: FlowJSON;
  onSave: (flow: FlowJSON) => void;
}

function Canvas({ initialFlow, onSave }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges ?? []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialFlow, null, 2));
  const [showTest, setShowTest] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const updateNodeData = (id: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data } : n));
    setSelectedNode((prev) => prev?.id === id ? { ...prev, data } : prev);
  };

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const typeStr = e.dataTransfer.getData("application/reactflow");
    if (!typeStr || !rfInstance || !reactFlowWrapper.current) return;
    const { type, defaultData } = JSON.parse(typeStr);
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = rfInstance.screenToFlowPosition({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const id = `node-${Date.now()}`;
    setNodes((nds) => [...nds, { id, type, position, data: defaultData }]);
  }, [rfInstance, setNodes]);

  const loadTemplate = (template: typeof TEMPLATES[0]) => {
    setNodes(template.flow.nodes as Node[]);
    setEdges(template.flow.edges);
    setShowTemplates(false);
    setSelectedNode(null);
  };

  const handleSave = () => {
    if (jsonMode) {
      try { onSave(JSON.parse(jsonText)); } catch { alert("JSON inválido"); }
    } else {
      onSave({ nodes, edges });
    }
  };

  const currentFlow: FlowJSON = { nodes, edges };

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-xl border border-gray-700">
      {/* Left: Node Palette */}
      <div className="w-44 bg-gray-900 border-r border-gray-700 flex flex-col p-3 gap-2 shrink-0">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Nós</p>
        {PALETTE.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow", JSON.stringify({ type: item.type, defaultData: item.defaultData }));
                e.dataTransfer.effectAllowed = "move";
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 cursor-grab hover:border-gray-500 transition select-none"
            >
              <div className={`w-5 h-5 rounded ${COLOR_MAP[item.color]} flex items-center justify-center shrink-0`}>
                <Icon size={11} className="text-white" />
              </div>
              <span className="text-gray-300 text-xs">{item.label}</span>
            </div>
          );
        })}

        <div className="mt-auto space-y-2">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">Templates</p>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-indigo-400 hover:border-indigo-600 text-xs transition flex items-center gap-1"
          >
            <ChevronRight size={12} className={`transition-transform ${showTemplates ? "rotate-90" : ""}`} />
            Ver templates
          </button>
          {showTemplates && TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => loadTemplate(t)}
              className="w-full text-left px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 hover:bg-indigo-900 text-xs transition"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Canvas or JSON */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setJsonMode(!jsonMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:text-white transition"
            >
              {jsonMode ? <Eye size={13} /> : <Code size={13} />}
              {jsonMode ? "Visual" : "JSON"}
            </button>
            <button
              onClick={() => setShowTest(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:text-white transition"
            >
              <Play size={13} /> Testar
            </button>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium"
          >
            <Save size={13} /> Salvar
          </button>
        </div>

        {jsonMode ? (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="flex-1 bg-gray-950 text-green-400 font-mono text-xs p-4 resize-none focus:outline-none"
          />
        ) : (
          <div ref={reactFlowWrapper} className="flex-1" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              onInit={setRfInstance}
              fitView
              deleteKeyCode="Delete"
            >
              <Background color="#374151" gap={20} />
              <Controls className="!bg-gray-800 !border-gray-700 !rounded-lg" />
              <MiniMap nodeColor="#6366f1" className="!bg-gray-800 !border-gray-700 !rounded-lg" />
            </ReactFlow>
          </div>
        )}
      </div>

      {/* Right: Node Config */}
      {selectedNode && (
        <NodeConfig
          node={selectedNode}
          onChange={updateNodeData}
          onClose={() => setSelectedNode(null)}
          onDelete={deleteNode}
        />
      )}

      {showTest && <TestModal flow={currentFlow} onClose={() => setShowTest(false)} />}
    </div>
  );
}

export default function FlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
