import { InsightsResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  Building2,
  Server,
  KeySquare,
  Target,
} from "lucide-react";

export function InsightsPanel({ insights }: { insights: InsightsResult }) {
  return (
    <Card className="border border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b bg-secondary/40">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <BrainCircuit className="w-5 h-5 text-primary" />
          Extracted Context
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Business Problems */}
        <div className="space-y-2.5 col-span-1 md:col-span-2">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Business Problems Identified
          </h4>
          <ul className="space-y-1.5">
            {insights.businessProblems.map((problem, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2.5 text-foreground leading-relaxed"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
            {insights.businessProblems.length === 0 && (
              <li className="text-sm text-muted-foreground italic">
                None identified in transcript
              </li>
            )}
          </ul>
        </div>

        {/* Industry */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Industry
          </h4>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary text-foreground border border-border">
            {insights.industry || "Unspecified"}
          </span>
        </div>

        {/* SAP Modules */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> SAP Modules Mentioned
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {insights.sapModules.map((module, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary text-primary-foreground"
              >
                {module}
              </span>
            ))}
            {insights.sapModules.length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                None identified
              </span>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2.5 col-span-1 md:col-span-2">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
            <KeySquare className="w-3.5 h-3.5" /> Key Topics & Entities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {insights.keywords.map((keyword, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-secondary text-foreground"
              >
                {keyword}
              </span>
            ))}
            {insights.keywords.length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                None identified
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
