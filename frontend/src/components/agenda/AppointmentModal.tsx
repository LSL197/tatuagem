"use client";

import { useState } from "react";
import api from "@/lib/api";
import { Appointment, AppointmentStatus } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function AppointmentModal({ appointment, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [price, setPrice] = useState<string>(appointment.price?.toString() ?? "");
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await api.put(`/api/v1/appointments/${appointment.id}`, {
      status,
      price: price ? parseFloat(price) : null,
      notes,
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 border border-gray-700">
        <h2 className="text-white font-bold text-lg">Agendamento</h2>

        <div className="space-y-1 text-sm">
          <p className="text-gray-300"><span className="text-gray-500">Cliente:</span> {appointment.client_name}</p>
          <p className="text-gray-300"><span className="text-gray-500">Telefone:</span> {appointment.client_phone}</p>
          <p className="text-gray-300"><span className="text-gray-500">Serviço:</span> {appointment.service}</p>
          <p className="text-gray-300"><span className="text-gray-500">Data:</span> {formatDate(appointment.datetime)}</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
          >
            {(Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
