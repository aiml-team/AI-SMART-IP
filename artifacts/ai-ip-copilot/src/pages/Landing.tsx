import { Link } from "wouter";
import {
  FileText,
  Lightbulb,
  Target,
  Zap,
  Database,
  Mail,
  BarChart3,
  Search,
  Upload,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNavigation } from "@/components/TopNavigation";

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    title: "Instant AI Analysis",
    description:
      "Paste a transcript and get structured business insights plus ranked IP recommendations in seconds — no manual effort required.",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
    title: "Scored Recommendations",
    description:
      "Each recommendation comes with a match score and rating (Strong / Good / Possible Match) so you know where to focus first.",
  },
  {
    icon: <Mail className="w-5 h-5 text-primary" />,
    title: "Email Pitch Generator",
    description:
      "Generate a complete, personalized follow-up email for any recommended IP — tailored to the customer's context with a compelling subject and body.",
  },
  {
    icon: <Database className="w-5 h-5 text-primary" />,
    title: "Managed IP Catalog",
    description:
      "Browse, search, and filter the full IP library. Add new IPs manually or upload them in bulk via Excel. Edit or delete entries at any time.",
  },
  {
    icon: <Upload className="w-5 h-5 text-primary" />,
    title: "Document Attachments",
    description:
      "Attach supporting documents — PDFs, presentations, specs — to each IP entry so all relevant materials are always in one place.",
  },
  {
    icon: <Search className="w-5 h-5 text-primary" />,
    title: "Search & View Modes",
    description:
      "Find any IP instantly with real-time search across names, modules, industries, and keywords. Switch between grid and list views to suit your workflow.",
  },
];

const STEPS = [
  {
    icon: <FileText className="w-4 h-4" />,
    title: "Paste or upload a meeting transcript",
    description:
      "After a discovery call or workshop, paste the conversation transcript directly into the analyzer. The tool accepts raw text from any meeting recording, notes, or chat export.",
  },
  {
    icon: <Search className="w-4 h-4" />,
    title: "AI extracts business context",
    description:
      "The AI reads the transcript and automatically identifies the customer's business problems, industry, SAP modules mentioned, and key topics — building a structured understanding of the customer's needs.",
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    title: "IP catalog is scored and ranked",
    description:
      "Every IP in the catalog is scored against the extracted context using a weighted algorithm: keywords (40%), business problems (30%), SAP modules (20%), and industry fit (10%). The top 3 matches are surfaced.",
  },
  {
    icon: <Lightbulb className="w-4 h-4" />,
    title: "AI generates personalized reasoning and pitches",
    description:
      "For each recommended IP, the AI writes a specific explanation of why it fits this customer and a customer-ready sales pitch tailored to their pain points — ready to use in the next conversation.",
  },
  {
    icon: <Mail className="w-4 h-4" />,
    title: "Generate a personalized email pitch",
    description:
      "With one click, generate a full email — subject line and body — personalised to the customer and the recommended IP. Copy it straight to your email client and send.",
  },
];

const PERSONAS = [
  {
    role: "SAP Account Executives",
    desc: "Quickly identify which IPs fit your customer conversations without needing deep technical knowledge of the full catalog.",
  },
  {
    role: "Pre-Sales Consultants",
    desc: "Accelerate solution matching after discovery workshops and produce polished customer pitches in minutes instead of hours.",
  },
  {
    role: "Delivery Consultants",
    desc: "Keep the IP library current by adding new solutions, attaching technical documents, and refining entries as the portfolio evolves.",
  },
];

const PROBLEMS = [
  {
    icon: <Users className="w-4 h-4 text-primary" />,
    text: "Knowledge gaps between sales reps and the full IP library",
  },
  {
    icon: <TrendingUp className="w-4 h-4 text-primary" />,
    text: "Slow, manual process of matching customer needs to solutions",
  },
  {
    icon: <Mail className="w-4 h-4 text-primary" />,
    text: "Generic pitches that don't speak to the customer's specific challenges",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavigation />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-background border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="relative container mx-auto max-w-5xl px-6 py-20 md:py-28 text-center space-y-7">
          <div className="inline-flex items-center gap-2 bg-secondary text-foreground/80 border border-border px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em]">
            <Lightbulb className="w-3.5 h-3.5" />
            SAP Sales &amp; Consulting Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-[1.05]">
            Turn customer calls into
            <br />
            <span className="italic font-serif font-normal text-primary">
              targeted SAP IP pitches
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Smart IP Advisor analyzes meeting transcripts with AI and instantly
            surfaces the most relevant SAP IP solutions — with personalized
            reasoning and ready-to-send emails.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" className="text-base px-7 h-12 shadow-md" asChild>
              <Link href="/app">
                Start Analyzing
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-7 h-12"
              asChild
            >
              <Link href="/catalog">Browse IP Catalog</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto max-w-5xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "5-step", label: "AI pipeline" },
            { value: "Top 3", label: "IPs surfaced per call" },
            { value: "4 signals", label: "Scoring dimensions" },
            { value: "1-click", label: "Email pitch generation" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-primary">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="container mx-auto max-w-5xl px-6 py-16 space-y-8">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-black text-foreground">
            The Problem It Solves
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          SAP has a large library of pre-built IP solutions, accelerators, and
          extensions — but connecting the right IP to the right customer at the
          right moment is hard. Sales teams often miss opportunities because
          they don't know which IP applies, or they spend hours manually
          reviewing solution catalogs after every discovery call.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROBLEMS.map(({ icon, text }) => (
            <div
              key={text}
              className="bg-card border border-border rounded-xl p-5 text-sm text-foreground/80 leading-relaxed flex gap-3 shadow-sm"
            >
              <span className="mt-0.5 shrink-0">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-muted/30 border-y border-border">
        <div className="container mx-auto max-w-5xl px-6 py-16 space-y-8">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black text-foreground">
              How It Works
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-x-16">
            <div>
              {STEPS.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="pb-8 pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-primary">{step.icon}</span>
                      <h3 className="font-bold text-foreground text-sm">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-4 w-full max-w-xs">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Example output
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-primary/20 rounded-full w-full" />
                  <div className="h-2.5 bg-primary/15 rounded-full w-4/5" />
                  <div className="h-2.5 bg-primary/10 rounded-full w-3/5" />
                </div>
                <div className="pt-2 space-y-2">
                  {[
                    "Strong Match · 87%",
                    "Good Match · 72%",
                    "Possible Match · 54%",
                  ].map((label, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
                        i === 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : i === 1
                            ? "bg-secondary text-foreground border-border"
                            : "bg-card text-muted-foreground border-border"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <Button size="sm" className="w-full mt-2" asChild>
                  <Link href="/app">Try it now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="container mx-auto max-w-5xl px-6 py-16 space-y-8">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-black text-foreground">Key Features</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-secondary border border-border">
                {icon}
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who Is It For ── */}
      <section className="bg-secondary/50 border-y border-border">
        <div className="container mx-auto max-w-5xl px-6 py-16 space-y-8">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-black text-foreground">
              Who Is It For?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PERSONAS.map(({ role, desc }) => (
              <div
                key={role}
                className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  <h3 className="font-bold text-sm text-foreground">{role}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="container mx-auto max-w-5xl px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-black text-foreground">
          Ready to accelerate your SAP sales?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Paste your first meeting transcript and get AI-powered IP
          recommendations in seconds.
        </p>
        <Button size="lg" className="text-base px-8 h-12 shadow-md" asChild>
          <Link href="/app">
            Get Started Free
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card py-6 text-center text-sm text-muted-foreground">
        Smart IP Advisor — SAP Sales &amp; Consulting Intelligence Tool
      </footer>
    </div>
  );
}
