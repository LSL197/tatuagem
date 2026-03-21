"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { Appointment } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#34d399",
  completed: "#6366f1",
  cancelled: "#ef4444",
};

interface Props {
  appointments: Appointment[];
  onSelectAppointment: (a: Appointment) => void;
}

export default function AgendaCalendar({ appointments, onSelectAppointment }: Props) {
  const events = appointments.map((a) => ({
    id: a.id,
    title: `${a.client_name} — ${a.service}`,
    start: a.datetime,
    end: new Date(new Date(a.datetime).getTime() + a.duration_minutes * 60000).toISOString(),
    backgroundColor: STATUS_COLORS[a.status],
    borderColor: STATUS_COLORS[a.status],
    extendedProps: { appointment: a },
  }));

  return (
    <div className="fullcalendar-dark h-full">
      <style>{`
        .fullcalendar-dark .fc {
          --fc-border-color: #374151;
          --fc-button-bg-color: #4f46e5;
          --fc-button-border-color: #4f46e5;
          --fc-button-hover-bg-color: #4338ca;
          --fc-button-hover-border-color: #4338ca;
          --fc-button-active-bg-color: #3730a3;
          --fc-today-bg-color: rgba(99, 102, 241, 0.1);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: #1f2937;
          --fc-list-event-hover-bg-color: #374151;
          color: #f9fafb;
          height: 100%;
        }
        .fullcalendar-dark .fc-toolbar-title { color: #f9fafb; font-size: 1.1rem; font-weight: 600; }
        .fullcalendar-dark .fc-col-header-cell { background: #111827 !important; padding: 8px 0; }
        .fullcalendar-dark .fc-col-header-cell-cushion { color: #9ca3af; font-size: 0.75rem; font-weight: 500; text-transform: uppercase; text-decoration: none; }
        .fullcalendar-dark .fc-timegrid-slot-label { color: #6b7280; font-size: 0.7rem; }
        .fullcalendar-dark .fc-day-today .fc-col-header-cell-cushion { color: #818cf8 !important; font-weight: 700; }
        .fullcalendar-dark .fc-day-today { background: rgba(99, 102, 241, 0.1) !important; }
        .fullcalendar-dark .fc-timegrid-col.fc-day-today { background: rgba(99, 102, 241, 0.08) !important; }
        .fullcalendar-dark .fc-scrollgrid { border-color: #374151; }
        .fullcalendar-dark .fc-scrollgrid td, .fullcalendar-dark .fc-scrollgrid th { border-color: #374151; }
        .fullcalendar-dark .fc-event { border-radius: 4px; font-size: 0.75rem; padding: 2px 4px; cursor: pointer; }
        .fullcalendar-dark .fc-event-title { font-weight: 500; }
        .fullcalendar-dark .fc-button { border-radius: 6px; font-size: 0.8rem; padding: 4px 12px; }
        .fullcalendar-dark .fc-button-group .fc-button { border-radius: 0; }
        .fullcalendar-dark .fc-button-group .fc-button:first-child { border-radius: 6px 0 0 6px; }
        .fullcalendar-dark .fc-button-group .fc-button:last-child { border-radius: 0 6px 6px 0; }
        .fullcalendar-dark .fc-list-event-title a { color: #f9fafb; text-decoration: none; }
        .fullcalendar-dark .fc-list-day-cushion { background: #1f2937 !important; }
        .fullcalendar-dark .fc-list-day-text, .fullcalendar-dark .fc-list-day-side-text { color: #9ca3af; }
        .fullcalendar-dark .fc-daygrid-day-number { color: #9ca3af; text-decoration: none; }
        .fullcalendar-dark .fc-day-today .fc-daygrid-day-number { color: #818cf8; font-weight: 700; }
        .fullcalendar-dark .fc-timegrid-now-indicator-line { border-color: #ef4444; }
        .fullcalendar-dark .fc-timegrid-now-indicator-arrow { border-top-color: #ef4444; border-bottom-color: #ef4444; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="timeGridWeek"
        locale={ptBrLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        buttonText={{
          today: "Hoje",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          list: "Lista",
        }}
        events={events}
        eventClick={(info) => onSelectAppointment(info.event.extendedProps.appointment)}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        scrollTime="08:00:00"
        allDaySlot={false}
        nowIndicator
        height="100%"
      />
    </div>
  );
}
