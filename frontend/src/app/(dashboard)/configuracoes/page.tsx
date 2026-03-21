"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ConfiguracoesPage() {
  const [name, setName] = useState("");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/api/v1/settings/").then((r) => {
      setName(r.data.name);
      setAiProvider(r.data.ai_provider);
    });
  }, []);

  const save = async () => {
    await api.put("/api/v1/settings/", { name, ai_provider: aiProvider, ai_api_key: apiKey || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-4">
        <h2 className="text-white font-semibold">Estúdio</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nome do Estúdio</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-4">
        <h2 className="text-white font-semibold">Provedor de IA</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Provedor</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="groq">Llama (Groq)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Deixe em branco para manter a atual"
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
      >
        {saved ? "Salvo!" : "Salvar"}
      </button>
    </div>
  );
}
