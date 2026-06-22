import { IpRecommendation } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Mail,
  CheckCircle2,
  TrendingUp,
  Clock,
  Info,
  Check,
} from "lucide-react";
import { useState } from "react";
import { EmailPitchDialog } from "./EmailPitchDialog";
import { useToast } from "@/hooks/use-toast";

/* Match-strength config — single accent (primary) with varying weight/opacity */
function getScoreConfig(score: number) {
  if (score >= 70)
    return {
      label: "Strong Match",
      fill: "bg-primary", // solid navy
      text: "text-primary",
      labelChip: "bg-primary text-primary-foreground border-primary",
      ring: "ring-primary/30",
    };
  if (score >= 40)
    return {
      label: "Good Match",
      fill: "bg-primary/60", // 60% navy
      text: "text-primary/80",
      labelChip: "bg-secondary text-foreground border-border",
      ring: "ring-primary/15",
    };
  return {
    label: "Possible Match",
    fill: "bg-primary/30", // pale navy
    text: "text-muted-foreground",
    labelChip: "bg-card text-muted-foreground border-border",
    ring: "ring-border",
  };
}

/* Status pills — same restrained system as IpDetail */
function effortConfig(effort: string) {
  if (effort === "Low") return "bg-secondary text-foreground border-border";
  if (effort === "High")
    return "bg-foreground text-background border-foreground";
  return "bg-card text-foreground border-border";
}
function maturityConfig(maturity: string) {
  if (maturity === "Mature")
    return "bg-primary text-primary-foreground border-primary";
  if (maturity === "MVP") return "bg-secondary text-foreground border-border";
  return "bg-card text-muted-foreground border-border";
}

export function IpRecommendationCard({
  recommendation,
}: {
  recommendation: IpRecommendation;
}) {
  const [copied, setCopied] = useState(false);
  const [pitchDialogOpen, setPitchDialogOpen] = useState(false);
  const { toast } = useToast();

  const cfg = getScoreConfig(recommendation.score);

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(recommendation.pitch);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Sales pitch has been copied.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group bg-card">
        {/* Header */}
        <CardHeader className="border-b border-border pb-4 bg-secondary/30">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-xl font-bold text-foreground leading-tight">
                {recommendation.ipName}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${effortConfig(recommendation.implementationEffort)}`}
                >
                  <Clock className="w-3 h-3" />
                  {recommendation.implementationEffort} Effort
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${maturityConfig(recommendation.maturityLevel)}`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {recommendation.maturityLevel}
                </span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-16 h-16 rounded-full ring-4 ${cfg.ring} flex flex-col items-center justify-center bg-card shadow-sm`}
              >
                <span
                  className={`text-2xl font-black leading-none ${cfg.text}`}
                >
                  {recommendation.score}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">
                  / 100
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.labelChip}`}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-border/60 rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.fill} rounded-full transition-all duration-700`}
              style={{ width: `${recommendation.score}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-5 pb-6 space-y-5">
          {/* Rationale */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Matching Rationale
            </h4>
            <p className="text-sm leading-relaxed text-foreground/90 pl-1">
              {recommendation.reason}
            </p>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Customer-ready Pitch
            </h4>
            <div className="bg-primary text-primary-foreground text-sm p-4 rounded-lg relative group/pitch">
              <p className="pr-10 italic leading-relaxed font-serif">
                &ldquo;{recommendation.pitch}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 opacity-0 group-hover/pitch:opacity-100 transition-opacity"
                onClick={handleCopyPitch}
                title="Copy pitch"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-secondary/30 border-t border-border pt-4 pb-4 flex justify-end">
          <Button
            size="sm"
            className="font-semibold shadow-sm"
            onClick={() => setPitchDialogOpen(true)}
          >
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
