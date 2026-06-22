import { InsightsResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Building2, Server, KeySquare, Target } from "lucide-react";

const KEYWORD_COLORS = [
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-sky-100 text-sky-700 border-sky-200",
];

const MODULE_COLORS = [
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-sky-600 text-white",
  "bg-teal-600 text-white",
];

export function InsightsPanel({ insights }: { insights: InsightsResult }) {
  return (
    <Card className="border border-border shadow-sm bg-gradient-to-br from-background to-slate-50/50 overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-violet-50 to-blue-50/40">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-violet-700">
          <BrainCircuit className="w-5 h-5" />
          Extracted Context
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

        {/* Business Problems */}
        <div className="space-y-2.5 col-span-1 md:col-span-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Business Problems Identified
          </h4>
          <ul className="space-y-1.5">
            {insights.businessProblems.map((problem, i) => (
              <li key={i} className="text-sm flex items-start gap-2.5 text-foreground leading-relaxed">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
            {insights.businessProblems.length === 0 && (
              <li className="text-sm text-muted-foreground italic">None identified in transcript</li>
            )}
          </ul>
        </div>

        {/* Industry */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Industry
          </h4>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            {insights.industry || "Unspecified"}
          </span>
        </div>

        {/* SAP Modules */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" /> SAP Modules Mentioned
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {insights.sapModules.map((module, i) => (
              <span
                key={i}
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${MODULE_COLORS[i % MODULE_COLORS.length]}`}
              >
                {module}
              </span>
            ))}
            {insights.sapModules.length === 0 && (
              <span className="text-sm text-muted-foreground italic">None identified</span>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2.5 col-span-1 md:col-span-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-teal-600 flex items-center gap-1.5">
            <KeySquare className="w-3.5 h-3.5" /> Key Topics & Entities
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {insights.keywords.map((keyword, i) => (
              <span
                key={i}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${KEYWORD_COLORS[i % KEYWORD_COLORS.length]}`}
              >
                {keyword}
              </span>
            ))}
            {insights.keywords.length === 0 && (
              <span className="text-sm text-muted-foreground italic">None identified</span>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
