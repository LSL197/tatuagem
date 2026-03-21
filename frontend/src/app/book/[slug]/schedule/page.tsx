"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { User } from "@/types";

const schema = z.object({
  client_name: z.string().min(2, "Nome obrigatório"),
  client_phone: z.string().min(10, "WhatsApp obrigatório"),
  service: z.string().min(1, "Selecione um serviço"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SERVICES = ["Tatuagem Pequena", "Tatuagem Média", "Tatuagem Grande", "Sleeve", "Correção / Cover-up", "Touch-up"];

export default function SchedulePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [artist, setArtist] = useState<User | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const service = watch("service");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/artists/${slug}`)
      .then((r) => r.json())
      .then(setArtist);
  }, [slug]);

  useEffect(() => {
    if (artist) {
      api.get(`/api/v1/appointments/availability/${artist.id}?date=${currentMonth}`)
        .then((r) => setSlots(r.data.slots ?? []));
    }
  }, [artist, currentMonth]);

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot || !artist) return;
    await api.post("/api/v1/appointments/", {
      artist_id: artist.id,
      ...data,
      datetime: selectedSlot,
    });
    setDone(true);
  };

  if (done) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-white text-2xl font-bold">Agendamento recebido!</h2>
          <p className="text-gray-400">Você receberá uma confirmação no WhatsApp em breve.</p>
          <button onClick={() => router.push("/book")} className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">
            Voltar ao início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950">
      <header className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-white font-bold text-lg">{artist?.name}</h1>
        <p className="text-gray-400 text-sm">Agendar sessão</p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Escolha o serviço</h2>
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map((s) => (
                  <label key={s} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${service === s ? "border-indigo-500 bg-indigo-900/30" : "border-gray-700 bg-gray-900"}`}>
                    <input {...register("service")} type="radio" value={s} className="sr-only" />
                    <span className="text-white text-sm">{s}</span>
                  </label>
                ))}
              </div>
              {errors.service && <p className="text-red-400 text-xs">{errors.service.message}</p>}
              <button type="button" onClick={() => service && setStep(2)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
                Próximo
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Escolha horário</h2>
              {slots.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum horário disponível este mês.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                  {slots.map((slot) => {
                    const d = new Date(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded-xl text-xs transition ${selectedSlot === slot ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                      >
                        {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        <br />
                        {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="button" onClick={() => selectedSlot && setStep(3)}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
                Próximo
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Seus dados</h2>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
                <input {...register("client_name")} className="w-full px-3 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500" placeholder="Seu nome" />
                {errors.client_name && <p className="text-red-400 text-xs mt-1">{errors.client_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">WhatsApp</label>
                <input {...register("client_phone")} className="w-full px-3 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500" placeholder="(91) 99999-9999" />
                {errors.client_phone && <p className="text-red-400 text-xs mt-1">{errors.client_phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Observações (opcional)</label>
                <textarea {...register("notes")} rows={3} className="w-full px-3 py-3 rounded-xl bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none" placeholder="Conte sobre sua ideia..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                {isSubmitting ? "Agendando..." : "Confirmar Agendamento"}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
