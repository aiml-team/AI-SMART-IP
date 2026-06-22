import { useState, useMemo } from "react";
import {
  useGetIpCatalog,
  useDeleteIpEntry,
  getGetIpCatalogQueryKey,
} from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { TopNavigation } from "@/components/TopNavigation";
import { CreateIpDialog } from "@/components/CreateIpDialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Database,
  Layers,
  Clock,
  PlusCircle,
  Building2,
  ArrowRight,
  LayoutGrid,
  List,
  Search,
  X,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import type { IpItem } from "@workspace/api-client-react";

/* Monochrome chip — single primary color */
const MODULE_CHIP = "bg-primary text-primary-foreground";

/* Effort & maturity use opacity/weight ramp instead of separate hues */
function effortConfig(effort: string) {
  if (effort === "Low")
    return {
      cls: "text-foreground font-bold",
      dot: "bg-primary",
      pill: "bg-secondary text-foreground border-border",
    };
  if (effort === "High")
    return {
      cls: "text-foreground font-bold",
      dot: "bg-foreground",
      pill: "bg-foreground text-background border-foreground",
    };
  return {
    cls: "text-foreground font-bold",
    dot: "bg-primary/50",
    pill: "bg-card text-foreground border-border",
  };
}

function maturityConfig(maturity: string) {
  if (maturity === "Mature")
    return {
      cls: "text-primary font-bold",
      dot: "bg-primary",
      pill: "bg-primary text-primary-foreground border-primary",
    };
  if (maturity === "MVP")
    return {
      cls: "text-foreground font-bold",
      dot: "bg-primary/60",
      pill: "bg-secondary text-foreground border-border",
    };
  return {
    cls: "text-muted-foreground font-bold",
    dot: "bg-muted-foreground/40",
    pill: "bg-card text-muted-foreground border-border",
  };
}

function matchesSearch(item: IpItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.sapModules.some((m) => m.toLowerCase().includes(q)) ||
    item.industries.some((ind) => ind.toLowerCase().includes(q)) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
    item.businessProblems.some((bp) => bp.toLowerCase().includes(q)) ||
    item.id.toLowerCase().includes(q)
  );
}

// ─── Grid card ──────────────────────────────────────────────────────────────

function GridCard({
  item,
  onClick,
  selected,
  onToggle,
  selecting,
}: {
  item: IpItem;
  onClick: () => void;
  selected: boolean;
  onToggle: (e: React.MouseEvent) => void;
  selecting: boolean;
}) {
  const effort = effortConfig(item.implementationEffort);
  const maturity = maturityConfig(item.maturityLevel);
  return (
    <Card
      className={`flex flex-col h-full transition-all duration-200 overflow-hidden cursor-pointer group relative ${selected ? "border-destructive/60 shadow-md ring-2 ring-destructive/20" : "hover:border-primary/40 hover:shadow-md"}`}
      onClick={onClick}
    >
      {/* checkbox overlay */}
      <button
        className={`absolute top-3 left-3 z-10 transition-opacity ${selecting || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        onClick={onToggle}
        title={selected ? "Deselect" : "Select"}
      >
        {selected ? (
          <CheckSquare className="w-5 h-5 text-destructive drop-shadow-sm" />
        ) : (
          <Square className="w-5 h-5 text-muted-foreground/60 hover:text-foreground bg-card rounded" />
        )}
      </button>

      <CardHeader
        className={`pb-4 border-b transition-colors ${selected ? "bg-destructive/5" : "bg-secondary/40"}`}
      >
        <div className="flex items-start justify-between gap-2 pl-6">
          <div>
            <CardTitle className="text-lg text-foreground font-bold leading-tight">
              {item.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-1.5 text-sm">
              {item.description}
            </CardDescription>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded shrink-0 font-mono">
            {item.id}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-5">
        <div className="space-y-4 flex-1">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> SAP Modules
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.sapModules.map((m) => (
                <span
                  key={m}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${MODULE_CHIP}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.12em] flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Industries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.industries.map((ind) => (
                <span
                  key={ind}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border font-medium"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-border/60 mt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${effort.dot}`} />
              <Clock className="w-3 h-3 text-muted-foreground/60" />
              <span className={`text-sm ${effort.cls}`}>
                {item.implementationEffort}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${maturity.dot}`} />
              <span className={`text-sm ${maturity.cls}`}>
                {item.maturityLevel}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            View <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function ListRow({
  item,
  onClick,
  selected,
  onToggle,
}: {
  item: IpItem;
  onClick: () => void;
  selected: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const effort = effortConfig(item.implementationEffort);
  const maturity = maturityConfig(item.maturityLevel);
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 border rounded-xl transition-all duration-150 cursor-pointer group ${selected ? "bg-destructive/5 border-destructive/40 ring-1 ring-destructive/20" : "bg-card border-border hover:border-primary/40 hover:shadow-sm"}`}
      onClick={onClick}
    >
      {/* checkbox */}
      <button
        className="shrink-0"
        onClick={onToggle}
        title={selected ? "Deselect" : "Select"}
      >
        {selected ? (
          <CheckSquare className="w-5 h-5 text-destructive" />
        ) : (
          <Square className="w-5 h-5 text-muted-foreground/40 hover:text-foreground group-hover:text-muted-foreground/70 transition-colors" />
        )}
      </button>

      <span className="text-[10px] font-bold text-muted-foreground bg-secondary border border-border px-2 py-1 rounded shrink-0 w-14 text-center font-mono">
        {item.id}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm truncate">
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.description}
        </p>
      </div>
      <div className="hidden md:flex items-center gap-1.5 shrink-0 max-w-[220px] flex-wrap">
        {item.sapModules.slice(0, 3).map((m) => (
          <span
            key={m}
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${MODULE_CHIP}`}
          >
            {m}
          </span>
        ))}
        {item.sapModules.length > 3 && (
          <span className="text-[10px] text-muted-foreground">
            +{item.sapModules.length - 3}
          </span>
        )}
      </div>
      <div className="hidden lg:flex items-center gap-1.5 shrink-0 max-w-[180px] flex-wrap">
        {item.industries.slice(0, 2).map((ind) => (
          <span
            key={ind}
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-foreground border border-border font-medium"
          >
            {ind}
          </span>
        ))}
        {item.industries.length > 2 && (
          <span className="text-[10px] text-muted-foreground">
            +{item.industries.length - 2}
          </span>
        )}
      </div>
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${effort.pill}`}
        >
          {item.implementationEffort}
        </span>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${maturity.pill}`}
        >
          {item.maturityLevel}
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Catalog() {
  const { data, isLoading } = useGetIpCatalog();
  const [showCreate, setShowCreate] = useState(false);
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const qc = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteIpEntry();

  const filtered = useMemo(() => {
    return (data?.items ?? []).filter((item) => matchesSearch(item, search));
  }, [data?.items, search]);

  const total = data?.items.length ?? 0;
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setConfirmBulkDelete(false);
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((i) => i.id)));
    }
    setConfirmBulkDelete(false);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync({ id })));
      qc.invalidateQueries({ queryKey: getGetIpCatalogQueryKey() });
      toast({
        title: `${ids.length} IP${ids.length > 1 ? "s" : ""} deleted`,
        description: "The selected IPs have been removed.",
      });
      setSelected(new Set());
      setConfirmBulkDelete(false);
    } catch {
      toast({
        title: "Delete failed",
        description: "Some entries could not be deleted.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToItem = (id: string) => {
    if (selected.size > 0) return;
    navigate(`/catalog/${id}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <TopNavigation />

      <main className="flex-1 container mx-auto max-w-7xl p-6 md:p-8 pb-28">
        {/* ── page header ── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground">
              <Database className="w-8 h-8 text-primary" />
              IP Solution Catalog
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Browse the complete repository of SAP IP solutions, extensions,
              and predefined architectures.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 font-semibold shadow-sm shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> Add IP
          </Button>
        </div>

        {/* ── toolbar ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, module, industry, keyword…"
              className="pl-9 pr-9 bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!isLoading && (
            <span className="text-sm text-muted-foreground shrink-0">
              {search ? (
                <>
                  <span className="font-semibold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  of {total} IPs
                </>
              ) : (
                <>
                  <span className="font-semibold text-foreground">{total}</span>{" "}
                  IPs
                </>
              )}
            </span>
          )}

          {/* select-all toggle (only when items exist) */}
          {!isLoading && filtered.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title={allFilteredSelected ? "Deselect all" : "Select all"}
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-destructive" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {allFilteredSelected ? "Deselect all" : "Select all"}
              </span>
            </button>
          )}

          {/* view toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 shrink-0 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-medium">Loading catalog data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Search className="w-10 h-10 opacity-20" />
            <p className="font-medium">No IPs match "{search}"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
              Clear search
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <GridCard
                key={item.id}
                item={item}
                onClick={() => navigateToItem(item.id)}
                selected={selected.has(item.id)}
                onToggle={(e) => toggleSelect(item.id, e)}
                selecting={selected.size > 0}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((item) => (
              <ListRow
                key={item.id}
                item={item}
                onClick={() => navigateToItem(item.id)}
                selected={selected.has(item.id)}
                onToggle={(e) => toggleSelect(item.id, e)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── floating bulk-delete bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl shadow-xl px-5 py-3">
            <span className="text-sm font-semibold text-foreground">
              <span className="text-destructive">{selected.size}</span> IP
              {selected.size > 1 ? "s" : ""} selected
            </span>
            <div className="w-px h-5 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8"
              onClick={() => {
                setSelected(new Set());
                setConfirmBulkDelete(false);
              }}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            {confirmBulkDelete ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Permanently delete {selected.size} IP
                  {selected.size > 1 ? "s" : ""}?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => setConfirmBulkDelete(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  Confirm
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => setConfirmBulkDelete(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete {selected.size}{" "}
                IP{selected.size > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      )}

      <CreateIpDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
