import { useGetDashboardSummary, useGetRevenueTrend, useGetPatientStats } from "@workspace/api-client-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Users, UserCheck, Bed, CalendarClock, FlaskConical, Pill, TrendingUp, Activity } from "lucide-react";

function StatCard({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: any; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-5 flex items-start gap-4 shadow-sm">
      <div className={`flex items-center justify-center w-11 h-11 rounded-lg shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function fmtDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { data: summary, isLoading: sLoading } = useGetDashboardSummary();
  const { data: trend } = useGetRevenueTrend();
  const { data: patientStats } = useGetPatientStats();

  const trendData = (trend ?? []).map(t => ({ ...t, date: fmtDate(t.date) }));
  const statsData = (patientStats ?? []).map(s => ({ ...s, date: fmtDate(s.date) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      {sLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Patients" value={summary?.totalPatients ?? 0} icon={Users} color="bg-blue-600" />
            <StatCard label="OP Patients" value={summary?.opPatients ?? 0} icon={UserCheck} sub="Outpatient" color="bg-cyan-600" />
            <StatCard label="IP Patients" value={summary?.ipPatients ?? 0} icon={Bed} sub="Inpatient" color="bg-indigo-600" />
            <StatCard label="Appointments Today" value={summary?.appointmentsToday ?? 0} icon={CalendarClock} color="bg-violet-600" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Lab Reports Today" value={summary?.labReportsToday ?? 0} icon={FlaskConical} color="bg-emerald-600" />
            <StatCard label="Lab Revenue" value={fmt(summary?.labRevenue ?? 0)} icon={TrendingUp} sub="Today" color="bg-teal-600" />
            <StatCard label="Pharmacy Revenue" value={fmt(summary?.pharmacyRevenue ?? 0)} icon={Pill} sub="Today" color="bg-orange-500" />
            <StatCard label="Total Revenue" value={fmt(summary?.totalRevenue ?? 0)} icon={Activity} sub="Today" color="bg-rose-600" />
          </div>
        </>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="labGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pharmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Area type="monotone" dataKey="labRevenue" name="Lab" stroke="#2563eb" fill="url(#labGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="pharmacyRevenue" name="Pharmacy" stroke="#f97316" fill="url(#pharmGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-card-border rounded-lg p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Patient Registrations (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Patients" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
