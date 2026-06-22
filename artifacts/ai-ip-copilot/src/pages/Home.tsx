import { useState, useRef } from "react";
import { useAnalyzeTranscript } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { parseVtt } from "@/lib/vtt-parser";
import { InsightsPanel } from "@/components/InsightsPanel";
import { IpRecommendationCard } from "@/components/IpRecommendationCard";
import { TopNavigation } from "@/components/TopNavigation";
import {
  Loader2,
  UploadCloud,
  Bot,
  Sparkles,
  MessageSquare,
  FileVideo2,
  X,
  FilePlus2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  id: string;
  name: string;
  text: string;
}

export default function Home() {
  const [manualText, setManualText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeTranscript = useAnalyzeTranscript();

  const processFiles = (files: File[]) => {
    if (!files.length) return;

    const accepted = files.filter(
      (f) =>
        f.name.toLowerCase().endsWith(".vtt") ||
        f.name.toLowerCase().endsWith(".txt"),
    );

    if (!accepted.length) {
      toast({
        title: "Unsupported file type",
        description: "Only .vtt and .txt files can be uploaded.",
        variant: "destructive",
      });
      return;
    }

    let loaded = 0;
    const newFiles: UploadedFile[] = [];

    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const text = file.name.endsWith(".vtt") ? parseVtt(content) : content;
        newFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          text: text.trim(),
        });
        loaded++;
        if (loaded === accepted.length) {
          setUploadedFiles((prev) => {
            const combined = [...prev, ...newFiles];
            toast({
              title: `${newFiles.length} file${newFiles.length > 1 ? "s" : ""} added`,
              description: `${combined.length} transcript${combined.length > 1 ? "s" : ""} queued for analysis.`,
            });
            return combined;
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only un-set when leaving the wrapper, not its children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    processFiles(files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setManualText("");
  };

  const buildConsolidatedTranscript = (): string => {
    const parts: string[] = [];

    uploadedFiles.forEach((f, i) => {
      parts.push(`=== Meeting ${i + 1}: ${f.name} ===\n${f.text}`);
    });

    const manual = manualText.trim();
    if (manual) {
      const label =
        uploadedFiles.length > 0 ? "=== Additional Notes ===\n" : "";
      parts.push(`${label}${manual}`);
    }

    return parts.join("\n\n");
  };

  const hasContent = uploadedFiles.length > 0 || manualText.trim().length > 0;

  const handleAnalyze = () => {
    if (!hasContent) {
      toast({
        title: "No content",
        description:
          "Please upload at least one VTT file or paste a transcript.",
        variant: "destructive",
      });
      return;
    }

    const consolidated = buildConsolidatedTranscript();

    analyzeTranscript.mutate(
      { data: { transcript: consolidated } },
      {
        onError: (err) => {
          toast({
            title: "Analysis Failed",
            description:
              err.message ||
              "There was an error communicating with the AI Copilot.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      <TopNavigation />

      <main className="flex-1 container mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Input ── */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card className="shadow-sm border-border bg-card flex flex-col h-full">
            <CardHeader className="pb-4 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-primary" />
                Customer Conversation
              </CardTitle>
              <CardDescription className="text-sm mt-1.5">
                Upload one or more WebVTT files and / or paste text — everything
                is consolidated before analysis.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 pt-5 flex-1">
              {/* ── Unified input: type, drag-and-drop, or click to upload ── */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex-1 flex flex-col rounded-xl border-2 border-dashed transition-colors shadow-inner overflow-hidden ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border/80 bg-muted/30 hover:border-primary/40 focus-within:border-primary/60 focus-within:bg-background"
                }`}
                style={{ minHeight: "380px" }}
              >
                <input
                  type="file"
                  accept=".vtt,.txt"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />

                {/* Uploaded file chips inside the box */}
                {uploadedFiles.length > 0 && (
                  <div className="px-3 pt-3 pb-2 border-b border-border/60 bg-background/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {uploadedFiles.length} file
                        {uploadedFiles.length > 1 ? "s" : ""} attached
                      </span>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {uploadedFiles.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-1.5 bg-secondary text-foreground border border-border rounded-full px-2.5 py-0.5 text-xs font-medium max-w-[220px]"
                        >
                          <FileVideo2 className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <span className="truncate" title={f.name}>
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(f.id);
                            }}
                            className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5 transition-colors shrink-0"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Textarea — typing area */}
                <Textarea
                  placeholder={
                    uploadedFiles.length > 0
                      ? "Add extra notes, or drop more .vtt / .txt files anywhere in this box..."
                      : "Type or paste your transcript here, or drag & drop .vtt / .txt files into this box.\n\nExample:\nSpeaker 1: We are looking to migrate to S/4HANA but concerned about data quality...\nSpeaker 2: Yes, our legacy systems have a lot of duplicate records and missing material attributes."
                  }
                  className="flex-1 resize-none font-mono text-sm leading-relaxed p-4 pb-12 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />

                {/* Bottom toolbar — upload button */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pointer-events-auto flex items-center gap-1.5 bg-background/90 backdrop-blur border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 shadow-sm transition-colors"
                  >
                    {uploadedFiles.length > 0 ? (
                      <>
                        <FilePlus2 className="w-3.5 h-3.5" /> Add files
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" /> Upload .vtt /
                        .txt
                      </>
                    )}
                  </button>
                  {!uploadedFiles.length && !manualText && (
                    <span className="pointer-events-none text-[11px] text-muted-foreground/70 pr-2">
                      type · paste · drag & drop
                    </span>
                  )}
                </div>

                {/* Drag overlay */}
                {isDragging && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10 backdrop-blur-sm pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      Drop files to upload
                    </p>
                    <p className="text-xs text-primary/70 mt-0.5">
                      .vtt or .txt
                    </p>
                  </div>
                )}
              </div>

              {/* ── Consolidation notice (when >1 files) ── */}
              {uploadedFiles.length > 1 && (
                <div className="flex items-start gap-2 bg-muted border border-border rounded-lg px-3 py-2.5 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>
                    All{" "}
                    <strong className="text-foreground">
                      {uploadedFiles.length} files
                    </strong>{" "}
                    will be consolidated into a single analysis to surface
                    insights and IP recommendations across the full
                    conversation.
                  </span>
                </div>
              )}

              {/* ── Analyze button ── */}
              <Button
                onClick={handleAnalyze}
                className="w-full font-bold shadow-sm mt-auto"
                disabled={analyzeTranscript.isPending || !hasContent}
              >
                {analyzeTranscript.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing
                    Context...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" /> Analyze Conversation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Results ── */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {analyzeTranscript.isPending && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground min-h-[500px] bg-card rounded-xl border border-dashed border-primary/20 shadow-sm p-8 animate-in fade-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Bot className="w-12 h-12 text-primary relative z-10 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-foreground mt-6 mb-2 tracking-tight">
                Analyzing Intelligence...
              </h3>
              <p className="text-sm max-w-md text-center text-muted-foreground/80 leading-relaxed">
                {uploadedFiles.length > 1
                  ? `Consolidating ${uploadedFiles.length} transcripts, extracting insights, and finding the best IP matches.`
                  : "Extracting core business problems, mapping to SAP modules, and searching the IP catalog for the best solutions."}
              </p>
            </div>
          )}

          {!analyzeTranscript.isPending && !analyzeTranscript.data && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground min-h-[500px] bg-card/50 rounded-xl border border-dashed border-border p-8">
              <Sparkles className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-medium text-foreground/70 mb-1">
                Awaiting Input
              </h3>
              <p className="text-sm text-center">
                Run analysis to generate IP recommendations.
              </p>
            </div>
          )}

          {!analyzeTranscript.isPending && analyzeTranscript.data && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              <InsightsPanel insights={analyzeTranscript.data.insights} />

              <div className="space-y-5">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                    Recommended IP Solutions
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                      Top {analyzeTranscript.data.recommendations.length}
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {analyzeTranscript.data.recommendations.map((rec) => (
                    <IpRecommendationCard key={rec.ipId} recommendation={rec} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
