import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateIpEntry,
  useUploadIpCatalog,
  getGetIpCatalogQueryKey,
} from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, PlusCircle } from "lucide-react";

interface CreateIpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  businessProblems: "",
  industries: "",
  sapModules: "",
  keywords: "",
  triggerSignals: "",
  valueProposition: "",
  pitch: "",
  differentiators: "",
  implementationEffort: "Medium",
  maturityLevel: "MVP",
};

type FormState = typeof EMPTY_FORM;

function parseList(val: string): string[] {
  return val
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
        {label}
        {hint && <span className="ml-1 text-[10px] text-muted-foreground font-normal normal-case">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

export function CreateIpDialog({ open, onOpenChange }: CreateIpDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    added: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const createIp = useCreateIpEntry();
  const uploadIp = useUploadIpCatalog();

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast({ title: "Required fields missing", description: "Name and description are required.", variant: "destructive" });
      return;
    }

    createIp.mutate(
      {
        data: {
          name: form.name.trim(),
          description: form.description.trim(),
          businessProblems: parseList(form.businessProblems),
          industries: parseList(form.industries),
          sapModules: parseList(form.sapModules),
          keywords: parseList(form.keywords),
          triggerSignals: parseList(form.triggerSignals),
          valueProposition: form.valueProposition.trim(),
          pitch: form.pitch.trim(),
          differentiators: form.differentiators.trim(),
          implementationEffort: form.implementationEffort,
          maturityLevel: form.maturityLevel,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "IP Created", description: `"${form.name}" has been added to the catalog.` });
          queryClient.invalidateQueries({ queryKey: getGetIpCatalogQueryKey() });
          setForm(EMPTY_FORM);
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ title: "Failed to create IP", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!uploadFile) {
      toast({ title: "No file selected", description: "Please select an Excel file first.", variant: "destructive" });
      return;
    }

    uploadIp.mutate(
      { data: { file: uploadFile } },
      {
        onSuccess: (result) => {
          setUploadResult(result);
          queryClient.invalidateQueries({ queryKey: getGetIpCatalogQueryKey() });
          if (result.added > 0) {
            toast({ title: "Upload Complete", description: `${result.added} IP(s) added to the catalog.` });
          }
        },
        onError: (err) => {
          toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const downloadTemplate = () => {
    const headers = [
      "name",
      "description",
      "businessProblems",
      "industries",
      "sapModules",
      "keywords",
      "triggerSignals",
      "valueProposition",
      "pitch",
      "differentiators",
      "implementationEffort",
      "maturityLevel",
    ];
    const exampleRow = [
      "My IP Solution",
      "Brief description of the IP",
      "Manual process; Data errors",
      "Manufacturing; Retail",
      "SAP S/4HANA; SAP BTP",
      "automation; efficiency",
      "manual work; high cost",
      "Reduce effort by 50%",
      "Customer-ready pitch text",
      "Key differentiators",
      "Medium",
      "Mature",
    ];

    const csv = [headers.join(","), exampleRow.map((v) => `"${v}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ip_catalog_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Add IP Solution
          </DialogTitle>
          <DialogDescription>
            Add a new IP solution to the catalog using the form below or by uploading an Excel file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="form" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="form">Manual Form</TabsTrigger>
            <TabsTrigger value="upload">Upload Excel</TabsTrigger>
          </TabsList>

          {/* ── Manual Form ── */}
          <TabsContent value="form" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FieldRow label="Name *">
                <Input placeholder="e.g. Invoice Automation Accelerator" value={form.name} onChange={set("name")} />
              </FieldRow>

              <FieldRow label="Description *">
                <Textarea
                  placeholder="Brief description of what this IP does"
                  value={form.description}
                  onChange={set("description")}
                  className="resize-none"
                  rows={2}
                />
              </FieldRow>

              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Implementation Effort">
                  <Select
                    value={form.implementationEffort}
                    onValueChange={(v) => setForm((f) => ({ ...f, implementationEffort: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>

                <FieldRow label="Maturity Level">
                  <Select
                    value={form.maturityLevel}
                    onValueChange={(v) => setForm((f) => ({ ...f, maturityLevel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Concept">Concept</SelectItem>
                      <SelectItem value="MVP">MVP</SelectItem>
                      <SelectItem value="Mature">Mature</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>

              <FieldRow label="Business Problems" hint="(comma or newline separated)">
                <Textarea
                  placeholder="Manual invoice processing, Data entry errors, ..."
                  value={form.businessProblems}
                  onChange={set("businessProblems")}
                  className="resize-none"
                  rows={2}
                />
              </FieldRow>

              <FieldRow label="Industries" hint="(comma separated)">
                <Input placeholder="Manufacturing, Retail, All industries" value={form.industries} onChange={set("industries")} />
              </FieldRow>

              <FieldRow label="SAP Modules" hint="(comma separated)">
                <Input placeholder="SAP S/4HANA, SAP BTP, SAP Document AI" value={form.sapModules} onChange={set("sapModules")} />
              </FieldRow>

              <FieldRow label="Keywords" hint="(comma separated)">
                <Input placeholder="invoice, OCR, automation, finance" value={form.keywords} onChange={set("keywords")} />
              </FieldRow>

              <FieldRow label="Trigger Signals" hint="(comma separated — phrases that indicate a fit)">
                <Input placeholder="manual invoices, AP workload, paper-based processes" value={form.triggerSignals} onChange={set("triggerSignals")} />
              </FieldRow>

              <FieldRow label="Value Proposition">
                <Input placeholder="Reduce effort by 60%; Improve accuracy to 95%+" value={form.valueProposition} onChange={set("valueProposition")} />
              </FieldRow>

              <FieldRow label="Customer Pitch">
                <Textarea
                  placeholder="Customer-ready sales pitch text"
                  value={form.pitch}
                  onChange={set("pitch")}
                  className="resize-none"
                  rows={2}
                />
              </FieldRow>

              <FieldRow label="Differentiators">
                <Input placeholder="Pre-trained models; Fast deployment (<6 weeks)" value={form.differentiators} onChange={set("differentiators")} />
              </FieldRow>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createIp.isPending}>
                {createIp.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : <><PlusCircle className="w-4 h-4 mr-2" />Create IP</>}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ── Excel Upload ── */}
          <TabsContent value="upload" className="space-y-5">
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center flex flex-col items-center gap-3">
              <FileSpreadsheet className="w-10 h-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Upload an Excel (.xlsx) or CSV file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Each row becomes one IP entry. Required columns: <strong>name</strong>, <strong>description</strong>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
              {uploadFile && (
                <p className="text-xs bg-primary/5 text-primary border border-primary/10 rounded px-3 py-1.5 font-medium">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>

            {uploadResult && (
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {uploadResult.added > 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold">
                    {uploadResult.added} added, {uploadResult.skipped} skipped
                  </span>
                </div>
                {uploadResult.errors.length > 0 && (
                  <ul className="text-xs text-destructive space-y-1 pl-6 list-disc">
                    {uploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={handleUpload} disabled={uploadIp.isPending || !uploadFile}>
                {uploadIp.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><UploadCloud className="w-4 h-4 mr-2" />Upload & Import</>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
