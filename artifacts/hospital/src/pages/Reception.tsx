import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPatients, getListPatientsQueryKey,
  useCreatePatient, useUpdatePatient,
  useListAppointments, getListAppointmentsQueryKey,
  useCreateAppointment, useUpdateAppointment, useDeleteAppointment,
} from "@workspace/api-client-react";
import { Search, Plus, Edit2, Printer, CalendarCheck, UserPlus, Users, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "register" | "search" | "appointments" | "op-ip";

const DEPARTMENTS = ["General Medicine", "Cardiology", "Orthopedics", "Gynecology", "Pediatrics", "ENT", "Dermatology", "Neurology", "Ophthalmology", "Dentistry"];
const TIME_SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>;
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input {...props} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
    </div>
  );
}

function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <select {...props} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function PatientForm({ onSuccess, patient }: { onSuccess: () => void; patient?: any }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: patient ?? {} });
  const { toast } = useToast();
  const qc = useQueryClient();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();

  const onSubmit = async (data: any) => {
    if (!data.name || !data.phone || !data.age || !data.gender || !data.address) {
      toast({ title: "Missing required fields", variant: "destructive" }); return;
    }
    try {
      if (patient) {
        await updatePatient.mutateAsync({ id: patient.id, data });
        toast({ title: "Patient updated successfully" });
      } else {
        await createPatient.mutateAsync({ data });
        toast({ title: "Patient registered successfully" });
      }
      qc.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      reset();
      onSuccess();
    } catch {
      toast({ title: "Failed to save patient", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
          <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Patient full name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Age *</label>
          <input type="number" {...register("age", { valueAsNumber: true })} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Age" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Gender *</label>
          <select {...register("gender")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Phone *</label>
          <input {...register("phone")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Mobile number" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Blood Group</label>
          <select {...register("bloodGroup")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select</option>
            {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Address *</label>
          <input {...register("address")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Full address" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
          <input type="email" {...register("email")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Email address" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Patient Type *</label>
          <select {...register("type")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="OP">OP - Outpatient</option>
            <option value="IP">IP - Inpatient</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Doctor Name</label>
          <input {...register("doctorName")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Attending doctor" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
          <select {...register("department")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
          <textarea {...register("notes")} rows={2} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Clinical notes" />
        </div>
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
        {isSubmitting ? "Saving..." : patient ? "Update Patient" : "Register Patient"}
      </button>
    </form>
  );
}

function PatientSearch({ onSelect }: { onSelect?: (p: any) => void }) {
  const [search, setSearch] = useState("");
  const [editPatient, setEditPatient] = useState<any>(null);
  const { data: patients = [], isLoading } = useListPatients(search ? { search } : {});

  if (editPatient) {
    return (
      <div>
        <button onClick={() => setEditPatient(null)} className="mb-4 text-sm text-primary hover:underline">← Back to search</button>
        <h3 className="font-semibold text-foreground mb-4">Edit Patient</h3>
        <PatientForm patient={editPatient} onSuccess={() => setEditPatient(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or patient ID..."
          className="w-full pl-9 pr-4 py-2.5 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Searching...</div> : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {patients.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:border-primary/40 transition-colors">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{p.name}</span>
                  <Badge color={p.type === "OP" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>{p.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.patientId} · {p.age}y · {p.gender} · {p.phone}</p>
                {p.doctorName && <p className="text-xs text-muted-foreground">Dr. {p.doctorName} · {p.department}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {onSelect && <button onClick={() => onSelect(p)} className="px-2 py-1 text-xs text-primary border border-primary/30 rounded hover:bg-primary/10 transition-colors">Select</button>}
                <button onClick={() => setEditPatient(p)} className="p-1.5 rounded hover:bg-muted transition-colors">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
          {patients.length === 0 && search && <p className="text-sm text-muted-foreground text-center py-6">No patients found</p>}
        </div>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: appointments = [], isLoading } = useListAppointments({ date: selectedDate });
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();
  const { data: patients = [] } = useListPatients({});

  const onSubmit = async (data: any) => {
    try {
      await createAppt.mutateAsync({ data: { ...data, patientId: Number(data.patientId) } });
      toast({ title: "Appointment booked" });
      qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      reset(); setShowForm(false);
    } catch { toast({ title: "Failed to book appointment", variant: "destructive" }); }
  };

  const updateStatus = async (id: number, status: string) => {
    await updateAppt.mutateAsync({ id, data: { status } });
    qc.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Date:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Book Appointment
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted/50 border border-border rounded-lg space-y-4">
          <h3 className="font-semibold text-sm text-foreground">New Appointment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Patient *</label>
              <select {...register("patientId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Doctor *</label>
              <input {...register("doctorName")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Doctor name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department *</label>
              <select {...register("department")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date *</label>
              <input type="date" {...register("date")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Time Slot *</label>
              <select {...register("timeSlot")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select time</option>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
              <input {...register("notes")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isSubmitting ? "Booking..." : "Book"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : appointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No appointments for this date</div>
        ) : appointments.map(a => (
          <div key={a.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{a.patientName}</span>
                <Badge color={a.status === "completed" ? "bg-green-100 text-green-700" : a.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                  {a.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Dr. {a.doctorName} · {a.department} · {a.timeSlot}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {a.status === "scheduled" && (
                <>
                  <button onClick={() => updateStatus(a.id, "completed")} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Done</button>
                  <button onClick={() => updateStatus(a.id, "cancelled")} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Cancel</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OPIPTab() {
  const [filter, setFilter] = useState<"" | "OP" | "IP">("");
  const { data: patients = [], isLoading } = useListPatients(filter ? { type: filter } : {});

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["", "OP", "IP"] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {t || "All"} {t === "OP" ? "Outpatients" : t === "IP" ? "Inpatients" : "Patients"}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">{patients.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Patient ID", "Name", "Age/Gender", "Phone", "Type", "Doctor", "Department", "Registered"].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : patients.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{p.patientId}</td>
                <td className="px-3 py-2.5 font-medium">{p.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.age}y / {p.gender}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.phone}</td>
                <td className="px-3 py-2.5"><Badge color={p.type === "OP" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>{p.type}</Badge></td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.doctorName || "-"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{p.department || "-"}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && patients.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No patients found</p>}
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "register", label: "Register Patient", icon: UserPlus },
  { id: "search", label: "Search Patients", icon: Search },
  { id: "appointments", label: "Appointments", icon: CalendarCheck },
  { id: "op-ip", label: "OP / IP Management", icon: Users },
];

export default function Reception() {
  const [tab, setTab] = useState<Tab>("register");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reception</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage patient registrations, appointments, and records</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6 shadow-sm">
        {tab === "register" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">New Patient Registration</h2>
            {registerSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">Patient registered successfully!</div>}
            <PatientForm onSuccess={() => setRegisterSuccess(true)} />
          </div>
        )}
        {tab === "search" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Search Patients</h2>
            <PatientSearch />
          </div>
        )}
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "op-ip" && <OPIPTab />}
      </div>
    </div>
  );
}
