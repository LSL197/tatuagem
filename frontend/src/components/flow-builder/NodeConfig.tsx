"use client";

import { Node } from "@xyflow/react";
import { X } from "lucide-react";

interface Props {
  node: Node;
  onChange: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function NodeConfig({ node, onChange, onClose, onDelete }: Props) {
  const data = node.data as Record<string, unknown>;
  const set = (key: string, value: unknown) => onChange(node.id, { ...data, [key]: value });

  return (
    <div className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-white text-sm font-semibold">Configurar nó</span>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {node.type === "TriggerNode" && <TriggerConfig data={data} set={set} />}
        {node.type === "MessageNode" && <MessageConfig data={data} set={set} />}
        {node.type === "ConditionNode" && <ConditionConfig data={data} set={set} />}
        {node.type === "DelayNode" && <DelayConfig data={data} set={set} />}
        {node.type === "ActionNode" && <ActionConfig data={data} set={set} />}
        {node.type === "AIAgentNode" && <AIAgentConfig data={data} set={set} />}
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => onDelete(node.id)}
          className="w-full py-2 rounded-lg text-sm text-red-400 border border-red-800 hover:bg-red-950 transition"
        >
          Remover nó
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
    >
      <option value="">Selecione...</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
    />
  );
}

function TriggerConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Canal">
        <Select
          value={data.channel as string}
          onChange={(v) => set("channel", v)}
          options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "instagram", label: "Instagram DM" }]}
        />
      </Field>
      <Field label="Palavra-chave que dispara o fluxo">
        <Input value={data.keyword as string} onChange={(v) => set("keyword", v)} placeholder="ex: quero tatuar" />
      </Field>
    </>
  );
}

function MessageConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Mensagem">
        <textarea
          value={(data.message as string) ?? ""}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Digite a mensagem que será enviada..."
          rows={5}
          className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500 resize-none"
        />
      </Field>
      <p className="text-xs text-gray-500">Use {"{{nome}}"} para incluir o nome do contato.</p>
    </>
  );
}

function ConditionConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="A resposta do usuário">
        <Select
          value={data.condition as string}
          onChange={(v) => set("condition", v)}
          options={[
            { value: "contains", label: "contém" },
            { value: "equals", label: "é igual a" },
            { value: "starts_with", label: "começa com" },
          ]}
        />
      </Field>
      <Field label="Valor">
        <Input value={data.value as string} onChange={(v) => set("value", v)} placeholder="ex: sim" />
      </Field>
      <div className="rounded-lg bg-gray-800 p-3 text-xs text-gray-400 space-y-1">
        <p>↙ <span className="text-green-400">Handle esquerdo</span> = condição verdadeira (Sim)</p>
        <p>↘ <span className="text-red-400">Handle direito</span> = condição falsa (Não)</p>
      </div>
    </>
  );
}

function DelayConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <>
      <Field label="Aguardar">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={(data.amount as number) ?? 1}
            onChange={(e) => set("amount", parseInt(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
          />
          <Select
            value={data.unit as string}
            onChange={(v) => set("unit", v)}
            options={[
              { value: "minutes", label: "Minutos" },
              { value: "hours", label: "Horas" },
              { value: "days", label: "Dias" },
            ]}
          />
        </div>
      </Field>
    </>
  );
}

function ActionConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <Field label="Ação a executar">
      <Select
        value={data.action as string}
        onChange={(v) => set("action", v)}
        options={[
          { value: "save_lead", label: "Salvar Lead" },
          { value: "create_appointment", label: "Criar Agendamento" },
          { value: "send_booking_link", label: "Enviar Link /book" },
          { value: "notify_artist", label: "Notificar Tatuador" },
        ]}
      />
    </Field>
  );
}

function AIAgentConfig({ data, set }: { data: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <Field label="Tipo de agente">
      <Select
        value={data.agent_type as string}
        onChange={(v) => set("agent_type", v)}
        options={[
          { value: "consultant", label: "Consultor de Ideias" },
          { value: "qualifier", label: "Qualificação de Lead" },
        ]}
      />
    </Field>
  );
}
