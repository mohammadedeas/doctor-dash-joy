import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventDropArg, DateSelectArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { useClinic } from "@/lib/clinic-store";
import type { Appointment } from "@/lib/clinic-types";
import { formatLocalDate } from "@/lib/clinic-utils";
import { AppointmentDialog } from "@/components/appointment-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricStat } from "@/components/metric-stat";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Printer,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  confirmed: { bg: "#10b981", border: "#059669", text: "#fff" },
  pending: { bg: "#f59e0b", border: "#d97706", text: "#fff" },
  cancelled: { bg: "#ef4444", border: "#dc2626", text: "#fff" },
  completed: { bg: "#3b82f6", border: "#2563eb", text: "#fff" },
};



function CalendarPage() {
  const { state, upsertAppointment, deleteAppointment } = useClinic();
  const calendarRef = useRef<FullCalendar>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultStartTime, setDefaultStartTime] = useState<string>("");
  const [defaultEndTime, setDefaultEndTime] = useState<string>("");

  const [view, setView] = useState<string>("timeGridWeek");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dentistFilter, setDentistFilter] = useState<string>("all");
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const dentists = useMemo(() => {
    const set = new Set(state.appointments.map((a) => a.dentistName).filter(Boolean));
    return Array.from(set);
  }, [state.appointments]);

  const filteredAppointments = useMemo(() => {
    return state.appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (dentistFilter !== "all" && a.dentistName !== dentistFilter) return false;
      if (search) {
        const term = search.toLowerCase();
        const matches =
          a.patientName.toLowerCase().includes(term) ||
          a.visitType.toLowerCase().includes(term) ||
          (a.phone || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [state.appointments, statusFilter, dentistFilter, search]);

  const events = useMemo(() => {
    return filteredAppointments.map((a) => {
      const color = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
      return {
        id: a.id,
        title: `${a.patientName} — ${a.visitType}`,
        start: `${a.date}T${a.startTime}`,
        end: `${a.date}T${a.endTime}`,
        backgroundColor: color.bg,
        borderColor: color.border,
        textColor: color.text,
        extendedProps: { appointment: a },
      };
    });
  }, [filteredAppointments]);

  const today = formatLocalDate(new Date());
  const todayAppointments = useMemo(
    () =>
      state.appointments
        .filter((a) => a.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [state.appointments, today]
  );

  // Reminders on mount
  useEffect(() => {
    const now = new Date();
    const upcoming = state.appointments.filter((a) => {
      if (a.date !== today || a.status === "cancelled" || a.status === "completed") return false;
      const [h, m] = a.startTime.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const diffMin = (start.getTime() - now.getTime()) / 60000;
      return diffMin > 0 && diffMin <= 30;
    });
    if (upcoming.length > 0) {
      toast.info(`You have ${upcoming.length} appointment(s) in the next 30 minutes.`);
    }
  }, [state.appointments, today]);

  function handleEventClick(arg: EventClickArg) {
    setEditId(arg.event.id);
    setDefaultDate("");
    setDefaultStartTime("");
    setDefaultEndTime("");
    setDialogOpen(true);
  }

  function handleSelectSlot(arg: DateSelectArg) {
    const start = arg.start;
    const end = arg.end;
    const dateStr = formatLocalDate(start);
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);
    setEditId(null);
    setDefaultDate(dateStr);
    setDefaultStartTime(startTime);
    setDefaultEndTime(endTime);
    setDialogOpen(true);
  }

  function handleDateClick(arg: DateClickArg) {
    const date = arg.date;
    const dateStr = formatLocalDate(date);
    const hour = date.getHours();
    const startHour = hour === 0 ? 9 : hour;
    const startTime = `${String(startHour).padStart(2, "0")}:00`;
    const endHour = startHour + 1;
    const endTime = `${String(endHour).padStart(2, "0")}:00`;
    setEditId(null);
    setDefaultDate(dateStr);
    setDefaultStartTime(startTime);
    setDefaultEndTime(endTime);
    setDialogOpen(true);
  }

  function handleEventDrop(arg: EventDropArg) {
    const appt = state.appointments.find((a) => a.id === arg.event.id);
    if (!appt) return;
    const start = arg.event.start;
    const end = arg.event.end;
    if (!start || !end) return;
    const dateStr = formatLocalDate(start);
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);

    upsertAppointment({
      ...appt,
      date: dateStr,
      startTime,
      endTime,
    });
    toast.success("Appointment rescheduled");
  }

  function handleEventResize(arg: any) {
    const appt = state.appointments.find((a) => a.id === arg.event.id);
    if (!appt) return;
    const end = arg.event.end;
    if (!end) return;
    const endTime = end.toTimeString().slice(0, 5);
    upsertAppointment({
      ...appt,
      endTime,
    });
    toast.success("Appointment duration updated");
  }

  function goToToday() {
    calendarRef.current?.getApi().today();
  }
  function goPrev() {
    calendarRef.current?.getApi().prev();
  }
  function goNext() {
    calendarRef.current?.getApi().next();
  }
  function changeView(v: string) {
    setView(v);
    calendarRef.current?.getApi().changeView(v);
  }

  function openNew() {
    setEditId(null);
    setDefaultDate(today);
    setDefaultStartTime("09:00");
    setDefaultEndTime("10:00");
    setDialogOpen(true);
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = todayAppointments
      .map(
        (a) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${a.startTime} — ${a.endTime}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${a.patientName}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${a.visitType}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;">${a.dentistName || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #ddd;"><span class="capitalize">${a.status}</span></td>
      </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Schedule — ${today}</title>
          <style>
            body { font-family: Inter, sans-serif; padding: 40px; color: #333; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 14px; color: #666; margin-bottom: 20px; font-weight: 400; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-weight: 600; }
            .capitalize { text-transform: capitalize; }
          </style>
        </head>
        <body>
          <h1>${state.settings.clinicName}</h1>
          <h2>Daily Schedule — ${today}</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Visit Type</th>
                <th>Dentist</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#999;">No appointments today</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100dvh-120px)] min-h-[400px]">
      {/* Main Calendar */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 bg-background pb-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="outline" size="icon" onClick={goPrev}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goNext}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {[
                { key: "dayGridMonth", label: "Month" },
                { key: "timeGridWeek", label: "Week" },
                { key: "timeGridDay", label: "Day" },
                { key: "listWeek", label: "List" },
              ].map((v) => (
                <Button
                  key={v.key}
                  variant={view === v.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeView(v.key)}
                >
                  {v.label}
                </Button>
              ))}
            </div>

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="size-4 mr-1" /> Print
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="size-4 mr-1" /> New
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[8rem] max-w-[13rem]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36 shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dentistFilter} onValueChange={setDentistFilter}>
              <SelectTrigger className="w-full sm:w-40 shrink-0">
                <SelectValue placeholder="Dentist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dentists</SelectItem>
                {dentists.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1 text-[11px] text-muted-foreground" title={status}>
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: color.bg }} />
                  <span className="capitalize hidden sm:inline">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 min-h-0 rounded-xl border bg-card overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={view}
            headerToolbar={false}
            events={events}
            editable={!isTouch}
            selectable={true}
            selectMirror={true}
            eventClick={handleEventClick}
            select={handleSelectSlot}
            dateClick={handleDateClick}
            eventDrop={isTouch ? undefined : handleEventDrop}
            eventResize={isTouch ? undefined : handleEventResize}
            stickyHeaderDates={true}
            height="100%"
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: "08:00",
              endTime: "20:00",
            }}
            nowIndicator={true}
            dayMaxEvents={true}
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
          />
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-full lg:w-60 xl:w-72 shrink-0 space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">Today ({today})</h3>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No appointments today.</p>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setEditId(a.id);
                    setDialogOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {a.startTime} — {a.endTime}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 capitalize"
                      style={{
                        backgroundColor: STATUS_COLORS[a.status]?.bg + "20",
                        color: STATUS_COLORS[a.status]?.bg,
                        borderColor: STATUS_COLORS[a.status]?.border,
                      }}
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium mt-0.5">{a.patientName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.visitType} {a.dentistName ? `• ${a.dentistName}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-primary" />
            <h3 className="font-semibold text-sm">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MetricStat variant="tile" label="Today" value={todayAppointments.length} />
            <MetricStat
              variant="tile"
              label="Upcoming"
              value={state.appointments.filter((a) => a.date > today && a.status !== "cancelled").length}
            />
            <MetricStat
              variant="tile"
              label="Pending"
              value={state.appointments.filter((a) => a.status === "pending").length}
            />
            <MetricStat
              variant="tile"
              label="Missed"
              value={state.appointments.filter((a) => a.date < today && a.status === "pending").length}
            />
          </div>
        </Card>
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointmentId={editId}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
      />
    </div>
  );
}
