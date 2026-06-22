import { IpRecommendation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Mail, CheckCircle2, TrendingUp, Clock, Info, Check } from "lucide-react";
import { useState } from "react";
import { EmailPitchDialog } from "./EmailPitchDialog";
import { useToast } from "@/hooks/use-toast";

function getScoreConfig(score: number) {
  if (score >= 70) return {
    text: "text-emerald-600",
    bg: "bg-emerald-500",
    ring: "ring-emerald-200",
    glow: "shadow-emerald-100",
    headerGradient: "from-emerald-50/60 to-transparent",
    label: "Strong Match",
    labelColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  if (score >= 40) return {
    text: "text-amber-600",
    bg: "bg-amber-500",
    ring: "ring-amber-200",
    glow: "shadow-amber-100",
    headerGradient: "from-amber-50/60 to-transparent",
    label: "Good Match",
    labelColor: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return {
    text: "text-sky-600",
    bg: "bg-sky-500",
    ring: "ring-sky-200",
    glow: "shadow-sky-100",
    headerGradient: "from-sky-50/60 to-transparent",
    label: "Possible Match",
    labelColor: "bg-sky-100 text-sky-700 border-sky-200",
  };
}

function effortConfig(effort: string) {
  if (effort === "Low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (effort === "High") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function maturityConfig(maturity: string) {
  if (maturity === "Mature") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (maturity === "MVP") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
}

export function IpRecommendationCard({ recommendation }: { recommendation: IpRecommendation }) {
  const [copied, setCopied] = useState(false);
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const { toast } = useToast();

  const cfg = getScoreConfig(recommendation.score);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(recommendation.pitch);
    setCopied(true);
    toast({ title: "Copied to clipboard", description: "Sales pitch has been copied." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className={`overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-200 group bg-card ${cfg.glow}`}>
        {/* Header */}
        <CardHeader className={`border-b pb-4 bg-gradient-to-r ${cfg.headerGradient} bg-muted/10`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl font-bold text-foreground leading-tight">
                {recommendation.ipName}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${effortConfig(recommendation.implementationEffort)}`}>
                  <Clock className="w-3 h-3" />
                  {recommendation.implementationEffort} Effort
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${maturityConfig(recommendation.maturityLevel)}`}>
                  <TrendingUp className="w-3 h-3" />
                  {recommendation.maturityLevel}
                </span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={`w-16 h-16 rounded-full ring-4 ${cfg.ring} flex flex-col items-center justify-center bg-white shadow-sm`}>
                <span className={`text-2xl font-black leading-none ${cfg.text}`}>{recommendation.score}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">/ 100</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.labelColor}`}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bg} rounded-full transition-all duration-700`}
              style={{ width: `${recommendation.score}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-5 pb-6 space-y-5">
          {/* Rationale */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Matching Rationale
            </h4>
            <p className="text-sm leading-relaxed text-foreground/90 pl-1">
              {recommendation.reason}
            </p>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Customer-ready Pitch
            </h4>
            <div className="bg-blue-50 border border-blue-100 text-sm p-4 rounded-lg relative group/pitch">
              <p className="text-blue-900/90 pr-10 italic leading-relaxed">"{recommendation.pitch}"</p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-blue-400 hover:text-blue-700 hover:bg-blue-100 opacity-0 group-hover/pitch:opacity-100 transition-opacity"
                onClick={handleCopyPitch}
                title="Copy pitch"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t pt-4 pb-4 flex justify-end">
          <Button size="sm" className="font-semibold shadow-sm" onClick={() => setPitchDialogOpen(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Personalize Email Pitch
          </Button>
        </CardFooter>
      </Card>

      {pitchDialogOpen && (
        <EmailPitchDialog
          open={pitchDialogOpen}
          onOpenChange={setPitchDialogOpen}
          ipName={recommendation.ipName}
          reason={recommendation.reason}
        />
      )}
    </>
  );
}
