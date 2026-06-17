import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListMedicines, getListMedicinesQueryKey,
  useCreateMedicine, useUpdateMedicine, useDeleteMedicine,
  useListPharmacyBills, getListPharmacyBillsQueryKey,
  useCreatePharmacyBill, useGetPharmacyBill, useListPatients,
} from "@workspace/api-client-react";
import { Plus, Printer, Package, ReceiptText, History, Edit2, Trash2, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Tab = "inventory" | "create-bill" | "history" | "print-bill";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>;
}

function Inventory() {
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState<any>(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: medicines = [], isLoading } = useListMedicines(
    search || lowStock || expiringSoon ? { search: search || undefined, lowStock: lowStock || undefined, expiringSoon: expiringSoon || undefined } : {}
  );
  const createMed = useCreateMedicine();
  const updateMed = useUpdateMedicine();
  const deleteMed = useDeleteMedicine();

  const startEdit = (m: any) => {
    setEditMed(m);
    Object.entries(m).forEach(([k, v]) => setValue(k as any, v));
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice), minStock: Number(data.minStock) };
      if (editMed) {
        await updateMed.mutateAsync({ id: editMed.id, data: payload });
        toast({ title: "Medicine updated" });
      } else {
        await createMed.mutateAsync({ data: payload });
        toast({ title: "Medicine added to inventory" });
      }
      qc.invalidateQueries({ queryKey: getListMedicinesQueryKey() });
      reset(); setShowForm(false); setEditMed(null);
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this medicine?")) return;
    await deleteMed.mutateAsync({ id });
    qc.invalidateQueries({ queryKey: getListMedicinesQueryKey() });
    toast({ title: "Medicine removed" });
  };

  const today = new Date().toISOString().split("T")[0];
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 90);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines..."
            className="w-full pl-9 pr-4 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="w-4 h-4" />
          Low Stock
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={expiringSoon} onChange={e => setExpiringSoon(e.target.checked)} className="w-4 h-4" />
          Expiring Soon
        </label>
        <button onClick={() => { setShowForm(!showForm); setEditMed(null); reset(); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 ml-auto">
          <Plus className="w-4 h-4" /> Add Medicine
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted/50 border border-border rounded-lg space-y-4">
          <h3 className="font-semibold text-sm">{editMed ? "Edit Medicine" : "Add Medicine"}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Medicine Name *</label>
              <input {...register("name")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Brand name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Generic Name *</label>
              <input {...register("genericName")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Generic name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
              <input {...register("category")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. Antibiotic" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Manufacturer *</label>
              <input {...register("manufacturer")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Manufacturer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Batch Number *</label>
              <input {...register("batchNumber")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Batch no." />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity *</label>
              <input type="number" {...register("quantity")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Unit Price (₹) *</label>
              <input type="number" step="0.01" {...register("unitPrice")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Min Stock Level</label>
              <input type="number" {...register("minStock")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="10" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Expiry Date *</label>
              <input type="date" {...register("expiryDate")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">{editMed ? "Update" : "Add"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditMed(null); reset(); }} className="px-4 py-2 bg-muted text-foreground rounded-md text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {["Name", "Generic", "Category", "Batch", "Quantity", "Unit Price", "Expiry", "Status", ""].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Loading...</td></tr>
            ) : medicines.map(m => {
              const isLow = Number(m.quantity) <= Number(m.minStock);
              const isExpired = m.expiryDate <= today;
              const isExpiring = !isExpired && m.expiryDate <= cutoffStr;
              return (
                <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 font-medium">{m.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{m.genericName}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{m.category}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{m.batchNumber}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-semibold ${isLow ? "text-red-600" : "text-foreground"}`}>{m.quantity}</span>
                    {isLow && <AlertTriangle className="inline w-3.5 h-3.5 text-amber-500 ml-1" />}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-primary">₹{Number(m.unitPrice).toFixed(2)}</td>
                  <td className={`px-3 py-2.5 text-xs ${isExpired ? "text-red-600 font-semibold" : isExpiring ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{m.expiryDate}</td>
                  <td className="px-3 py-2.5">
                    {isExpired ? <Badge color="bg-red-100 text-red-700">Expired</Badge>
                      : isExpiring ? <Badge color="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                        : isLow ? <Badge color="bg-orange-100 text-orange-700">Low Stock</Badge>
                          : <Badge color="bg-green-100 text-green-700">OK</Badge>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(m)} className="p-1.5 rounded hover:bg-muted transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && medicines.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No medicines in inventory</p>}
      </div>
    </div>
  );
}

function CreateBill({ onCreated }: { onCreated: (id: number) => void }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { paymentMode: "cash", discount: 0 } });
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: medicines = [] } = useListMedicines({});
  const { data: patients = [] } = useListPatients({});
  const createBill = useCreatePharmacyBill();

  const [items, setItems] = useState<{ medicineId: number; quantity: number }[]>([]);

  const addItem = (medicineId: number) => {
    if (!medicineId || items.find(i => i.medicineId === medicineId)) return;
    setItems(prev => [...prev, { medicineId, quantity: 1 }]);
  };

  const removeItem = (medicineId: number) => setItems(prev => prev.filter(i => i.medicineId !== medicineId));
  const updateQty = (medicineId: number, quantity: number) => setItems(prev => prev.map(i => i.medicineId === medicineId ? { ...i, quantity: Math.max(1, quantity) } : i));

  const subtotal = items.reduce((sum, item) => {
    const m = medicines.find(m => m.id === item.medicineId);
    return sum + (m ? Number(m.unitPrice) * item.quantity : 0);
  }, 0);

  const onSubmit = async (data: any) => {
    if (!data.patientId || items.length === 0) {
      toast({ title: "Select a patient and add at least one medicine", variant: "destructive" }); return;
    }
    try {
      const bill = await createBill.mutateAsync({
        data: {
          patientId: Number(data.patientId),
          discount: Number(data.discount ?? 0),
          paymentMode: data.paymentMode,
          billDate: data.billDate || new Date().toISOString().split("T")[0],
          items,
        }
      });
      toast({ title: "Bill created successfully" });
      qc.invalidateQueries({ queryKey: getListPharmacyBillsQueryKey() });
      qc.invalidateQueries({ queryKey: getListMedicinesQueryKey() });
      reset(); setItems([]);
      onCreated(bill.id);
    } catch { toast({ title: "Failed to create bill", variant: "destructive" }); }
  };

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
          <label className="block text-xs font-medium text-muted-foreground mb-1">Bill Date *</label>
          <input type="date" {...register("billDate")} defaultValue={new Date().toISOString().split("T")[0]}
            className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Mode *</label>
          <select {...register("paymentMode")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Discount (₹)</label>
          <input type="number" step="0.01" {...register("discount")} className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" placeholder="0.00" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Add Medicines *</label>
        <select onChange={e => { addItem(Number(e.target.value)); e.target.value = ""; }}
          className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">Select medicine to add...</option>
          {medicines.map(m => <option key={m.id} value={m.id}>{m.name} – ₹{Number(m.unitPrice).toFixed(2)} (Stock: {m.quantity})</option>)}
        </select>
      </div>

      {items.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Medicine</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Unit Price</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const m = medicines.find(m => m.id === item.medicineId)!;
                return (
                  <tr key={item.medicineId} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{m?.name}<div className="text-xs text-muted-foreground">{m?.genericName}</div></td>
                    <td className="px-3 py-2">₹{Number(m?.unitPrice ?? 0).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.quantity} onChange={e => updateQty(item.medicineId, Number(e.target.value))} min={1} max={m?.quantity}
                        className="w-16 border border-input rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-primary">₹{(Number(m?.unitPrice ?? 0) * item.quantity).toFixed(2)}</td>
                    <td className="px-3 py-2"><button type="button" onClick={() => removeItem(item.medicineId)} className="text-destructive hover:opacity-70"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted/30 border-t border-border">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-right">Subtotal:</td>
                <td className="px-3 py-2 text-right font-bold">₹{subtotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button type="submit" disabled={isSubmitting || items.length === 0}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {isSubmitting ? "Creating..." : "Create Bill"}
      </button>
    </form>
  );
}

function BillHistory({ onPrint }: { onPrint: (id: number) => void }) {
  const [search, setSearch] = useState("");
  const { data: bills = [], isLoading } = useListPharmacyBills({});

  const filtered = bills.filter(b =>
    b.patientName.toLowerCase().includes(search.toLowerCase()) ||
    b.billNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name or bill number..."
        className="w-full border border-input rounded-md px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> :
          filtered.map(b => (
            <div key={b.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{b.billNumber}</span>
                  <Badge color="bg-blue-100 text-blue-700">{b.paymentMode.toUpperCase()}</Badge>
                </div>
                <p className="font-medium text-sm mt-0.5">{b.patientName}</p>
                <p className="text-xs text-muted-foreground">{b.billDate} · {(b.items as any[]).length} items · Total: ₹{Number(b.netAmount).toFixed(2)}</p>
              </div>
              <button onClick={() => onPrint(b.id)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Print">
                <Printer className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))
        }
        {!isLoading && filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No bills found</p>}
      </div>
    </div>
  );
}

function PrintBill({ billId }: { billId: number }) {
  const { data: bill, isLoading } = useGetPharmacyBill(billId);

  if (isLoading || !bill) return <div className="text-sm text-muted-foreground">Loading bill...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <h3 className="font-semibold">Pharmacy Bill Preview</h3>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      <div className="print-area p-8 border border-border rounded-lg bg-white font-sans text-sm">
        {/* Header */}
        <div className="text-center mb-6 pb-4 border-b-2 border-blue-800">
          <h1 className="text-2xl font-bold text-blue-900 tracking-widest">GLOBAL HOSPITAL</h1>
          <p className="text-xs text-gray-600 mt-1">No.16, 12th Avenue, Ashok Nagar, Chennai - 600083</p>
          <p className="text-xs text-gray-600">Ph: 96293 00281 / 87542 57951</p>
          <p className="text-sm font-bold text-blue-800 mt-2 tracking-widest">PHARMACY RECEIPT</p>
        </div>

        {/* Bill Info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-5 p-3 bg-gray-50 rounded">
          <div><span className="text-gray-500 text-xs">Bill Number:</span> <span className="font-semibold font-mono">{bill.billNumber}</span></div>
          <div><span className="text-gray-500 text-xs">Date:</span> <span className="font-semibold">{bill.billDate}</span></div>
          <div><span className="text-gray-500 text-xs">Patient Name:</span> <span className="font-semibold">{bill.patientName}</span></div>
          <div><span className="text-gray-500 text-xs">Payment Mode:</span> <span className="font-semibold uppercase">{bill.paymentMode}</span></div>
        </div>

        {/* Items */}
        <table className="w-full text-sm border-collapse mb-5">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="px-3 py-2 text-left text-xs">Medicine Name</th>
              <th className="px-3 py-2 text-center text-xs">Qty</th>
              <th className="px-3 py-2 text-right text-xs">Unit Price</th>
              <th className="px-3 py-2 text-right text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {(bill.items as any[]).map((item: any, i: number) => (
              <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                <td className="px-3 py-2 font-medium">{item.medicineName}</td>
                <td className="px-3 py-2 text-center">{item.quantity}</td>
                <td className="px-3 py-2 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-semibold">₹{Number(item.totalPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-56 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span className="font-medium">₹{Number(bill.totalAmount).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Discount:</span><span className="font-medium text-green-700">- ₹{Number(bill.discount).toFixed(2)}</span></div>
            <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1.5 mt-1.5">
              <span>Net Amount:</span><span className="text-blue-800">₹{Number(bill.netAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
          Thank you for choosing Global Hospital. Get well soon!
        </div>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "create-bill", label: "Create Bill", icon: ReceiptText },
  { id: "history", label: "Bill History", icon: History },
  { id: "print-bill", label: "Print Bill", icon: Printer },
];

export default function Pharmacy() {
  const [tab, setTab] = useState<Tab>("inventory");
  const [printBillId, setPrintBillId] = useState<number | null>(null);

  const handleCreated = (id: number) => {
    setPrintBillId(id);
    setTab("print-bill");
  };

  const handlePrint = (id: number) => {
    setPrintBillId(id);
    setTab("print-bill");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacy</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage medicine inventory, billing, and receipts</p>
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
        {tab === "inventory" && <Inventory />}
        {tab === "create-bill" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Create Pharmacy Bill</h2>
            <CreateBill onCreated={handleCreated} />
          </div>
        )}
        {tab === "history" && (
          <div>
            <h2 className="text-base font-semibold text-foreground mb-4">Bill History</h2>
            <BillHistory onPrint={handlePrint} />
          </div>
        )}
        {tab === "print-bill" && (
          <div>
            {printBillId ? (
              <PrintBill billId={printBillId} />
            ) : (
              <div className="text-center py-12">
                <Printer className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a bill from Bill History to print</p>
                <button onClick={() => setTab("history")} className="mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90">Go to History</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
