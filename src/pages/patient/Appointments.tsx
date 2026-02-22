import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CalendarClock, X, AlertCircle } from "lucide-react";
import apiClient from "@/lib/apiClient";

type Doctor = { user_id: string; name: string; specialization: string };
type Slot = { datetime: string; available: boolean };
type Appointment = { id: string; doctor_id: string; doctor_name: string; specialization: string; slot_datetime: string; status: string };

export default function Appointments() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    apiClient.get("/doctors").then(r => setDoctors(r.data)).catch(() => { });
    apiClient.get("/appointments").then(r => setAppointments(r.data)).catch(() => { });
  }

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    if (!selectedDoctor) { setSlots([]); return; }
    setLoadingSlots(true);
    apiClient.get(`/appointments/slots?doctor_id=${selectedDoctor.user_id}`)
      .then(r => setSlots(r.data)).catch(() => { })
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor]);

  async function book(slotDt: string) {
    if (!selectedDoctor) return;
    setBookingSlot(slotDt); setError(null);
    try {
      await apiClient.post("/appointments/book", { doctor_id: selectedDoctor.user_id, slot_datetime: slotDt });
      reload();
      setSelectedDoctor(null);
    } catch (e: any) { setError(e?.response?.data?.detail ?? "Booking failed."); }
    finally { setBookingSlot(null); }
  }

  async function cancel(id: string) {
    try {
      await apiClient.post("/appointments/cancel", { appointment_id: id });
      reload();
    } catch (e: any) { alert(e?.response?.data?.detail ?? "Cancellation failed."); }
  }

  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    const day = s.datetime.split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" subtitle="Book consultations with available doctors." />

      {/* My Appointments */}
      {appointments.length > 0 && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">My Appointments</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {appointments.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{a.doctor_name}</div>
                  <div className="text-xs text-slate-500">{a.specialization}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{new Date(a.slot_datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "confirmed" ? "green" : "amber"}>{a.status}</Badge>
                  {a.status === "confirmed" && (
                    <button onClick={() => cancel(a.id)} className="rounded-full border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 transition"><X size={12} /></button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Doctor Selection */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Book an Appointment</CardTitle>
          <CardDescription>Select a doctor, then choose an available time slot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-700 mb-2">Choose a doctor</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {doctors.map(d => (
                <button key={d.user_id} type="button" onClick={() => setSelectedDoctor(selectedDoctor?.user_id === d.user_id ? null : d)}
                  className={["rounded-xl border p-3 text-left transition-all", selectedDoctor?.user_id === d.user_id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                  <div className="font-semibold text-sm text-slate-900">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.specialization}</div>
                </button>
              ))}
              {doctors.length === 0 && <div className="text-sm text-slate-500 col-span-2">No doctors registered yet.</div>}
            </div>
          </div>

          {selectedDoctor && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-2">Available slots — {selectedDoctor.name}</div>
              {loadingSlots ? <div className="text-sm text-slate-500">Loading slots…</div> : (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([day, daySlots]) => (
                    <div key={day}>
                      <div className="text-xs font-medium text-slate-600 mb-1.5">{new Date(day).toLocaleDateString("en-IN", { weekday: "long", dateStyle: "medium" })}</div>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map(s => (
                          <button key={s.datetime} disabled={!s.available || bookingSlot === s.datetime} onClick={() => book(s.datetime)}
                            className={["rounded-xl border px-3 py-1.5 text-xs font-medium transition-all", s.available ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100" : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through"].join(" ")}>
                            {new Date(s.datetime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle size={14} />{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
