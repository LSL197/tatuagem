"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  onConfirm: (name: string, trigger: string, keyword: string) => void;
  onClose: () => void;
}

export default function NewAutomationModal({ onConfirm, onClose }: Props) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("keyword_whatsapp");
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keyword.trim()) return;
    onConfirm(name.trim(), trigger, keyword.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Nova Automação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Nome da automação</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Auto-reply quero tatuar"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Canal do gatilho</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="keyword_whatsapp">Palavra-chave no WhatsApp</option>
              <option value="keyword_instagram">Palavra-chave no Instagram DM</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-medium">Palavra-chave de disparo</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ex: quero tatuar"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500">O fluxo será disparado quando alguém enviar uma mensagem contendo essa palavra.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 text-sm transition">
              Cancelar
            </button>
            <button type="submit" disabled={!name.trim() || !keyword.trim()} className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition disabled:opacity-40">
              Criar e editar fluxo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
