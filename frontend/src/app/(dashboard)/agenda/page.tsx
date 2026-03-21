"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { Appointment } from "@/types";
import AppointmentModal from "@/components/agenda/AppointmentModal";

const AgendaCalendar = dynamic(
  () => import("@/components/agenda/AgendaCalendar"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-gray-400">Carregando calendário...</div> }
);

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const load = async () => {
    const res = await api.get("/api/v1/appointments/");
    setAppointments(res.data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Agenda</h1>
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700" style={{ height: "70vh" }}>
        <AgendaCalendar appointments={appointments} onSelectAppointment={setSelected} />
      </div>
      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
