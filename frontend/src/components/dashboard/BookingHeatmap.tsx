"use client";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface BookingHeatmapProps {
  data: HeatmapCell[];
}

export default function BookingHeatmap({ data }: BookingHeatmapProps) {
  const map: Record<string, number> = {};
  let max = 1;
  for (const cell of data) {
    const key = `${cell.day}-${cell.hour}`;
    map[key] = cell.count;
    if (cell.count > max) max = cell.count;
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="text-white font-semibold mb-4">Horários mais Agendados</h3>
      <div className="overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)` }}>
          <div />
          {HOURS.map((h) => (
            <div key={h} className="text-gray-400 text-xs text-center">{h}h</div>
          ))}
          {DAYS.map((day, d) => (
            <>
              <div key={`day-${d}`} className="text-gray-400 text-xs flex items-center">{day}</div>
              {HOURS.map((h) => {
                const count = map[`${d}-${h}`] || 0;
                const intensity = Math.round((count / max) * 255);
                return (
                  <div
                    key={`${d}-${h}`}
                    className="h-6 rounded"
                    style={{
                      backgroundColor: count === 0 ? "#1f2937" : `rgba(99, 102, 241, ${count / max})`,
                    }}
                    title={`${day} ${h}h: ${count} agendamentos`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
