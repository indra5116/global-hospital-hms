import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLabTests, getListLabTestsQueryKey,
  useCreateLabTest, useUpdateLabTest, useDeleteLabTest,
  useListLabReports, getListLabReportsQueryKey,
  useCreateLabReport, useGetLabReport,
  useUpdateLabReport, useListPatients,
} from "@workspace/api-client-react";
import { Plus, Printer, FlaskConical, ClipboardList, BookOpen, Edit2, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "catalogue" | "create-report" | "history" | "print";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>;
}

function LabTestsCatalogue() {
  const [showForm, setShowForm] = useState(false);
  const [editTest, setEditTest] = useState<any>(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: tests = [], isLoading } = useListLabTests();
  const createTest = useCreateLabTest();
  const updateTest = useUpdateLabTest();
  const deleteTest = useDeleteLabTest();

  const startEdit = (t: any) => {
    setEditTest(t);
    setValue("name", t.name); setValue("category", t.category);
    setValue("price", t.price); setValue("referenceRange", t.referenceRange);
    setValue("unit", t.unit); setValue("description", t.description);
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      if (editTest) {
        await updateTest.mutateAsync({ id: editTest.id, data: { ...data, price: Number(data.price) } });
        toast({ title: "Test updated" });
      } else {
        await createTest.mutateAsync({ data: { ...data, price: Number(data.price) } });
        toast({ title: "Test created" });
      }
      qc.invalidateQueries({ queryKey: getListLabTestsQueryKey() });
      reset(); setShowForm(false); setEditTest(null);
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this test?")) return;
    await deleteTest.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListLabTestsQueryKey() });
    toast({ title: "Test deleted" });
  };

  const categories = [...new Set(tests.map(t => t.category))];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{tests.length} test types configured</p>
        <button onClick={() => { setShowForm(!showForm); setEditTest(null); reset(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Test
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted/50 border border-border rounded-lg space-y-4">
          <h3 className="font-semibold text-sm">{editTest ? "Edit Test" : "New Lab Test"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Test Name *</label>
              <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Complete Blood Count" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
              <input {...register("category")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Haematology" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Price (INR) *</label>
              <input type="number" {...register("price")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Unit *</label>
              <input {...register("unit")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. g/dL" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Reference Range *</label>
              <input {...register("referenceRange")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. 11.5–16.5" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
              <input {...register("description")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">{editTest ? "Update" : "Create"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditTest(null); reset(); }} className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> :
          categories.map(cat => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</h3>
              <div className="space-y-1">
                {tests.filter(t => t.category === cat).map(t => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2.5 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">Range: {t.referenceRange} {t.unit}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-primary">₹{Number(t.price).toFixed(2)}</span>
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function CreateReport({ onCreated }: { onCreated: (id: number) => void }) {
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({ defaultValues: { items: [] as any[] } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: tests = [] } = useListLabTests();
  const { data: patients = [] } = useListPatients({});
  const createReport = useCreateLabReport();

  const [selectedTests, setSelectedTests] = useState<{ testId: number; result: string; isAbnormal: boolean }[]>([]);

  const addTest = (testId: number) => {
    if (!testId || selectedTests.find(t => t.testId === testId)) return;
    setSelectedTests(prev => [...prev, { testId, result: "", isAbnormal: false }]);
  };

  const removeTest = (testId: number) => setSelectedTests(prev => prev.filter(t => t.testId !== testId));
  const updateResult = (testId: number, result: string) => setSelectedTests(prev => prev.map(t => t.testId === testId ? { ...t, result } : t));
  const toggleAbnormal = (testId: number) => setSelectedTests(prev => prev.map(t => t.testId === testId ? { ...t, isAbnormal: !t.isAbnormal } : t));

  const onSubmit = async (data: any) => {
    if (!data.patientId || !data.referredBy || !data.reportDate || selectedTests.length === 0) {
      toast({ title: "Please fill all required fields and add at least one test", variant: "destructive" }); return;
    }
    try {
      const report = await createReport.mutateAsync({
        data: {
          patientId: Number(data.patientId),
          referredBy: data.referredBy,
          reportDate: data.reportDate,
          notes: data.notes,
          items: selectedTests.map(t => ({ labTestId: t.testId, result: t.result, isAbnormal: t.isAbnormal })),
        }
      });
      toast({ title: "Lab report created" });
      qc.invalidateQueries({ queryKey: getListLabReportsQueryKey() });
      reset(); setSelectedTests([]);
      onCreated(report.id);
    } catch { toast({ title: "Failed to create report", variant: "destructive" }); }
  };

  const totalAmount = selectedTests.reduce((sum, st) => {
    const t = tests.find(t => t.id === st.testId);
    return sum + (t ? Number(t.price) : 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Patient *</label>
          <select {...register("patientId")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">Select patient</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patientId})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Referred By *</label>
          <input {...register("referredBy")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Doctor name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Report Date *</label>
          <input type="date" {...register("reportDate")} defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
          <input {...register("notes")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Optional notes" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Add Tests *</label>
        <select onChange={e => { addTest(Number(e.target.value)); e.target.value = ""; }}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Select a test to add...</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.name} – ₹{Number(t.price).toFixed(0)} ({t.category})</option>)}
        </select>
      </div>

      {selectedTests.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Test Name</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Reference Range</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Result *</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground">Abnormal</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Price</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {selectedTests.map(st => {
                const t = tests.find(t => t.id === st.testId)!;
                return (
                  <tr key={st.testId} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{t?.name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">{t?.referenceRange} {t?.unit}</td>
                    <td className="px-3 py-2">
                      <input value={st.result} onChange={e => updateResult(st.testId, e.target.value)}
                        className="w-full border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Enter result" />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={st.isAbnormal} onChange={() => toggleAbnormal(st.testId)} className="w-4 h-4" />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-primary">₹{Number(t?.price ?? 0).toFixed(0)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeTest(st.testId)} className="text-destructive hover:opacity-70"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-right">Total:</td>
                <td className="px-3 py-2 text-right font-bold text-primary">₹{totalAmount.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button type="submit" disabled={isSubmitting || selectedTests.length === 0}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {isSubmitting ? "Creating..." : "Create Lab Report"}
      </button>
    </form>
  );
}

function ReportHistory({ onPrint }: { onPrint: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const { data: reports = [], isLoading } = useListLabReports({});
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateReport = useUpdateLabReport();

  const markComplete = async (id: number) => {
    await updateReport.mutateAsync({ id, data: { status: "completed" } });
    qc.invalidateQueries({ queryKey: getListLabReportsQueryKey() });
    toast({ title: "Report marked complete" });
  };

  const filtered = reports.filter(r =>
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.referredBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient or doctor..."
        className="w-full border border-input rounded-md px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> :
          filtered.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{r.patientName}</span>
                  <Badge color={r.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Ref: Dr. {r.referredBy} · {r.reportDate} · {(r.items as any[]).length} tests · ₹{Number(r.totalAmount).toFixed(0)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.status === "pending" && (
                  <button onClick={() => markComplete(r.id)} className="p-1.5 rounded hover:bg-green-50 transition-colors" title="Mark complete">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <button onClick={() => onPrint(r.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Print">
                  <Printer className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))
        }
        {!isLoading && filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No reports found</p>}
      </div>
    </div>
  );
}

function PrintReport({ reportId }: { reportId: number }) {
  const { data: report, isLoading } = useGetLabReport(reportId);
  const { toast } = useToast();
  const qc = useQueryClient();
  const updateReport = useUpdateLabReport();
  const { register, handleSubmit } = useForm();

  const handleSign = async (data: any) => {
    await updateReport.mutateAsync({ id: reportId, data: { doctorSignature: data.doctorSignature, status: "completed" } });
    qc.invalidateQueries({ queryKey: getListLabReportsQueryKey() });
    toast({ title: "Signature saved" });
  };

  if (isLoading || !report) return <div className="text-sm text-muted-foreground">Loading report...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <h3 className="font-semibold text-foreground">Lab Report Preview</h3>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {!report.doctorSignature && (
        <form onSubmit={handleSubmit(handleSign)} className="flex gap-2 no-print">
          <input {...register("doctorSignature")} placeholder="Enter doctor signature / name for the report"
            className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
          <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:opacity-90">Save Signature</button>
        </form>
      )}

      <div className="print-area p-8 border border-border rounded-lg bg-white font-sans text-sm">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-blue-800">
          <h1 className="text-2xl font-bold text-blue-900 tracking-widest">GLOBAL HOSPITAL</h1>
          <p className="text-xs text-gray-600 mt-1">No.16, 12th Avenue, Ashok Nagar, Chennai - 600083</p>
          <p className="text-xs text-gray-600">Ph: 96293 00281 / 87542 57951</p>
          <p className="text-sm font-bold text-blue-800 mt-2 tracking-widest">LABORATORY REPORT</p>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5 p-3 bg-gray-50 rounded">
          <div><span className="text-gray-500 text-xs">Patient Name:</span> <span className="font-semibold text-sm">{report.patientName}</span></div>
          <div><span className="text-gray-500 text-xs">Report Date:</span> <span className="font-semibold text-sm">{report.reportDate}</span></div>
          <div><span className="text-gray-500 text-xs">Age / Gender:</span> <span className="font-semibold text-sm">{report.patientAge}y / {report.patientGender}</span></div>
          <div><span className="text-gray-500 text-xs">Report No:</span> <span className="font-semibold text-sm">LAB-{String(report.id).padStart(5, "0")}</span></div>
          <div><span className="text-gray-500 text-xs">Referred By:</span> <span className="font-semibold text-sm">Dr. {report.referredBy}</span></div>
          <div><span className="text-gray-500 text-xs">Status:</span> <span className={`font-semibold text-sm ${report.status === "completed" ? "text-green-700" : "text-yellow-700"}`}>{report.status.toUpperCase()}</span></div>
        </div>

        {/* Results Table */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="px-3 py-2 text-left text-xs font-semibold">Test Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Result</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Reference Range</th>
              <th className="px-3 py-2 text-left text-xs font-semibold">Unit</th>
              <th className="px-3 py-2 text-center text-xs font-semibold">Flag</th>
            </tr>
          </thead>
          <tbody>
            {(report.items as any[]).map((item: any, i: number) => (
              <tr key={i} className={`border-b border-gray-200 ${item.isAbnormal ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <td className="px-3 py-2 font-medium">{item.testName}</td>
                <td className={`px-3 py-2 font-bold ${item.isAbnormal ? "text-red-700" : "text-gray-900"}`}>{item.result}</td>
                <td className="px-3 py-2 text-gray-600">{item.referenceRange}</td>
                <td className="px-3 py-2 text-gray-600">{item.unit}</td>
                <td className="px-3 py-2 text-center">{item.isAbnormal ? <span className="text-red-600 font-bold">H/L</span> : <span className="text-green-600">N</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Amount */}
        <div className="text-right text-sm mb-6">
          <p className="font-semibold">Total Amount: <span className="text-blue-800 font-bold">₹{Number(report.totalAmount).toFixed(2)}</span></p>
        </div>

        {/* Signature */}
        <div className="mt-8 flex justify-between items-end">
          <div>
            {report.notes && <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {report.notes}</p>}
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 w-40">
              <p className="text-xs font-semibold">{report.doctorSignature || "________________"}</p>
              <p className="text-xs text-gray-500">Lab Technician / Doctor</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
          This is a computer generated report. For queries contact: 96293 00281
        </div>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "catalogue", label: "Test Catalogue", icon: BookOpen },
  { id: "create-report", label: "Create Report", icon: FlaskConical },
  { id: "history", label: "Report History", icon: ClipboardList },
  { id: "print", label: "Print Report", icon: Printer },
];

export default function Lab() {
  const [tab, setTab] = useState<Tab>("catalogue");
  const [printReportId, setPrintReportId] = useState<number | null>(null);

  const handleCreated = (id: number) => {
    setPrintReportId(id);
    setTab("print");
  };

  const handlePrint = (id: number) => {
    setPrintReportId(id);
    setTab("print");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laboratory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage lab tests, create reports, and print results</p>
      </div>

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
        {tab === "catalogue" && <LabTestsCatalogue />}
        {tab === "create-report" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Create Lab Report</h2>
            <CreateReport onCreated={handleCreated} />
          </div>
        )}
        {tab === "history" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Report History</h2>
            <ReportHistory onPrint={handlePrint} />
          </div>
        )}
        {tab === "print" && (
          <div>
            {printReportId ? (
              <PrintReport reportId={printReportId} />
            ) : (
              <div className="text-center py-12">
                <Printer className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a report from Report History to print</p>
                <button onClick={() => setTab("history")} className="mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">Go to History</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
