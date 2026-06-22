import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetIpById,
  useUpdateIpEntry,
  useDeleteIpEntry,
  useGetIpDocuments,
  useUploadIpDocument,
  useDeleteIpDocument,
  getGetIpByIdQueryKey,
  getGetIpDocumentsQueryKey,
  getGetIpCatalogQueryKey,
  type IpItem,
} from "@workspace/api-client-react";
import { TopNavigation } from "@/components/TopNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Pencil, Save, X, Loader2, UploadCloud, FileText,
  Trash2, Download, Layers, Building2, KeySquare, Target,
  Zap, TrendingUp, Clock, FileCheck, Megaphone, Star, AlertTriangle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseList(val: string): string[] {
  return val.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean);
}
function joinList(arr: string[]): string {
  return arr.join(", ");
}
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MODULE_COLORS = [
  "bg-blue-600 text-white", "bg-indigo-600 text-white", "bg-violet-600 text-white",
  "bg-sky-600 text-white", "bg-teal-600 text-white",
];
const KEYWORD_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200", "bg-blue-100 text-blue-700 border-blue-200",
  "bg-teal-100 text-teal-700 border-teal-200", "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

function effortStyle(e: string) {
  if (e === "Low") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (e === "High") return "bg-red-100 text-red-700 border-red-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}
function maturityStyle(m: string) {
  if (m === "Mature") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (m === "MVP") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-violet-100 text-violet-700 border-violet-200";
}

// ─── read-mode section ───────────────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </h3>
      {children}
    </div>
  );
}

// ─── edit form ───────────────────────────────────────────────────────────────

type FormState = {
  name: string; description: string; businessProblems: string; industries: string;
  sapModules: string; keywords: string; triggerSignals: string; valueProposition: string;
  pitch: string; differentiators: string; implementationEffort: string; maturityLevel: string;
};

function ipToForm(ip: IpItem): FormState {
  return {
    name: ip.name, description: ip.description,
    businessProblems: joinList(ip.businessProblems), industries: joinList(ip.industries),
    sapModules: joinList(ip.sapModules), keywords: joinList(ip.keywords),
    triggerSignals: joinList(ip.triggerSignals), valueProposition: ip.valueProposition,
    pitch: ip.pitch, differentiators: ip.differentiators,
    implementationEffort: ip.implementationEffort, maturityLevel: ip.maturityLevel,
  };
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function IpDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: ip, isLoading } = useGetIpById(id!);
  const { data: docsData, isLoading: docsLoading } = useGetIpDocuments(id!);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMutation = useUpdateIpEntry();
  const deleteMutation = useDeleteIpEntry();
  const uploadDocMutation = useUploadIpDocument();
  const deleteDocMutation = useDeleteIpDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const startEdit = () => { if (ip) { setForm(ipToForm(ip)); setEditing(true); } };
  const cancelEdit = () => { setEditing(false); setForm(null); };

  const handleSave = () => {
    if (!form || !id) return;
    updateMutation.mutate(
      { id, data: { ...form, businessProblems: parseList(form.businessProblems), industries: parseList(form.industries), sapModules: parseList(form.sapModules), keywords: parseList(form.keywords), triggerSignals: parseList(form.triggerSignals) } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetIpByIdQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetIpCatalogQueryKey() });
          setEditing(false); setForm(null);
          toast({ title: "Saved", description: "IP entry updated successfully." });
        },
        onError: (err) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetIpCatalogQueryKey() });
        toast({ title: "IP deleted", description: `${ip?.name} has been removed.` });
        navigate("/catalog");
      },
      onError: (err) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleDocUpload = (file: File) => {
    if (!id) return;
    uploadDocMutation.mutate({ id, data: { file } }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetIpDocumentsQueryKey(id) }); toast({ title: "Document uploaded", description: file.name }); },
      onError: (err) => toast({ title: "Upload failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleDeleteDoc = (docId: string) => {
    if (!id) return;
    deleteDocMutation.mutate({ id, docId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getGetIpDocumentsQueryKey(id) }); toast({ title: "Document removed" }); },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNavigation />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!ip) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNavigation />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <p className="text-lg">IP not found.</p>
          <Button variant="outline" onClick={() => navigate("/catalog")}><ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog</Button>
        </div>
      </div>
    );
  }

  const documents = docsData?.documents ?? [];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <TopNavigation />

      <main className="flex-1 container mx-auto max-w-5xl p-6 md:p-8 space-y-8">

        {/* ── header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/catalog")} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">{ip.id}</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${effortStyle(ip.implementationEffort)}`}>
                  <Clock className="w-3 h-3" /> {ip.implementationEffort} Effort
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${maturityStyle(ip.maturityLevel)}`}>
                  <TrendingUp className="w-3 h-3" /> {ip.maturityLevel}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{ip.name}</h1>
              <p className="text-muted-foreground mt-1 leading-relaxed max-w-2xl">{ip.description}</p>
            </div>
          </div>

          {/* action buttons */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEdit}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save Changes
                </Button>
              </>
            ) : confirmDelete ? (
              /* ── inline delete confirmation ── */
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-sm font-medium text-red-700">Delete this IP?</span>
                <Button variant="ghost" size="sm" className="h-7 text-muted-foreground" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button size="sm" className="h-7 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm Delete"}
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4 mr-1" /> Delete IP
                </Button>
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit IP
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── content ── */}
        {editing && form ? (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b pb-3 mb-2">Edit IP Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow label="Name *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldRow>
              <FieldRow label="Implementation Effort">
                <Select value={form.implementationEffort} onValueChange={(v) => setForm({ ...form, implementationEffort: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
                </Select>
              </FieldRow>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Description *"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FieldRow></div>
              <FieldRow label="SAP Modules (comma-separated)"><Input value={form.sapModules} onChange={(e) => setForm({ ...form, sapModules: e.target.value })} placeholder="SAP S/4HANA, SAP BTP" /></FieldRow>
              <FieldRow label="Industries (comma-separated)"><Input value={form.industries} onChange={(e) => setForm({ ...form, industries: e.target.value })} placeholder="Manufacturing, Retail" /></FieldRow>
              <FieldRow label="Keywords (comma-separated)"><Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="automation, AI, finance" /></FieldRow>
              <FieldRow label="Maturity Level">
                <Select value={form.maturityLevel} onValueChange={(v) => setForm({ ...form, maturityLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Concept">Concept</SelectItem><SelectItem value="MVP">MVP</SelectItem><SelectItem value="Mature">Mature</SelectItem></SelectContent>
                </Select>
              </FieldRow>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Business Problems (one per line or comma-separated)"><Textarea rows={3} value={form.businessProblems} onChange={(e) => setForm({ ...form, businessProblems: e.target.value })} /></FieldRow></div>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Trigger Signals (comma-separated)"><Textarea rows={2} value={form.triggerSignals} onChange={(e) => setForm({ ...form, triggerSignals: e.target.value })} /></FieldRow></div>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Value Proposition"><Textarea rows={2} value={form.valueProposition} onChange={(e) => setForm({ ...form, valueProposition: e.target.value })} /></FieldRow></div>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Customer Pitch"><Textarea rows={3} value={form.pitch} onChange={(e) => setForm({ ...form, pitch: e.target.value })} /></FieldRow></div>
              <div className="col-span-1 md:col-span-2"><FieldRow label="Differentiators"><Textarea rows={2} value={form.differentiators} onChange={(e) => setForm({ ...form, differentiators: e.target.value })} /></FieldRow></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
              <Section label="SAP Modules" icon={<Layers className="w-3.5 h-3.5 text-blue-600" />}>
                <div className="flex flex-wrap gap-1.5">
                  {ip.sapModules.length > 0 ? ip.sapModules.map((m, i) => (
                    <span key={m} className={`text-xs font-bold px-2.5 py-1 rounded ${MODULE_COLORS[i % MODULE_COLORS.length]}`}>{m}</span>
                  )) : <span className="text-sm text-muted-foreground italic">None listed</span>}
                </div>
              </Section>
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3">
              <Section label="Applicable Industries" icon={<Building2 className="w-3.5 h-3.5 text-amber-600" />}>
                <div className="flex flex-wrap gap-1.5">
                  {ip.industries.length > 0 ? ip.industries.map((ind) => (
                    <span key={ind} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">{ind}</span>
                  )) : <span className="text-sm text-muted-foreground italic">None listed</span>}
                </div>
              </Section>
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
              <Section label="Business Problems Addressed" icon={<Target className="w-3.5 h-3.5 text-rose-600" />}>
                <ul className="space-y-1.5">
                  {ip.businessProblems.length > 0 ? ip.businessProblems.map((p, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-rose-400 shrink-0" /><span>{p}</span>
                    </li>
                  )) : <span className="text-sm text-muted-foreground italic">None listed</span>}
                </ul>
              </Section>
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
              <Section label="Trigger Signals" icon={<Zap className="w-3.5 h-3.5 text-yellow-500" />}>
                <div className="flex flex-wrap gap-1.5">
                  {ip.triggerSignals.length > 0 ? ip.triggerSignals.map((s, i) => (
                    <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${KEYWORD_COLORS[i % KEYWORD_COLORS.length]}`}>{s}</span>
                  )) : <span className="text-sm text-muted-foreground italic">None listed</span>}
                </div>
              </Section>
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
              <Section label="Keywords" icon={<KeySquare className="w-3.5 h-3.5 text-teal-600" />}>
                <div className="flex flex-wrap gap-1.5">
                  {ip.keywords.length > 0 ? ip.keywords.map((kw, i) => (
                    <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${KEYWORD_COLORS[i % KEYWORD_COLORS.length]}`}>{kw}</span>
                  )) : <span className="text-sm text-muted-foreground italic">None listed</span>}
                </div>
              </Section>
            </div>
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
              <Section label="Value Proposition" icon={<Star className="w-3.5 h-3.5 text-violet-600" />}>
                <p className="text-sm text-foreground/90 leading-relaxed">{ip.valueProposition || <span className="text-muted-foreground italic">Not provided</span>}</p>
              </Section>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
              <Section label="Customer Pitch" icon={<Megaphone className="w-3.5 h-3.5 text-blue-600" />}>
                <p className="text-sm text-blue-900/90 leading-relaxed italic">"{ip.pitch || "No pitch provided"}"</p>
              </Section>
            </div>
            {ip.differentiators && (
              <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 col-span-1 md:col-span-2">
                <Section label="Differentiators" icon={<FileCheck className="w-3.5 h-3.5 text-emerald-600" />}>
                  <p className="text-sm text-foreground/90 leading-relaxed">{ip.differentiators}</p>
                </Section>
              </div>
            )}
          </div>
        )}

        {/* ── Documents section ── */}
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-violet-50/30">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Attached Documents
              <span className="ml-1 text-xs font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{documents.length}</span>
            </h2>
            <div>
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.txt,.png,.jpg,.jpeg"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocUpload(file); e.target.value = ""; }}
              />
              <Button size="sm" variant="outline" className="border-violet-200 text-violet-700 hover:bg-violet-50"
                onClick={() => fileRef.current?.click()} disabled={uploadDocMutation.isPending}>
                {uploadDocMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Upload Document
              </Button>
            </div>
          </div>
          {docsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <FileText className="w-10 h-10 opacity-20" />
              <p className="text-sm">No documents attached yet.</p>
              <Button variant="outline" size="sm" className="border-violet-200 text-violet-700 hover:bg-violet-50" onClick={() => fileRef.current?.click()}>
                <UploadCloud className="w-4 h-4 mr-2" /> Upload first document
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/catalog/${id}/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600"><Download className="w-4 h-4" /></Button>
                    </a>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDeleteDoc(doc.id)} disabled={deleteDocMutation.isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  );
}
