import { TopNavigation } from "@/components/TopNavigation";
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
} from "lucide-react";

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
          {number}
        </div>
        <div className="w-px flex-1 bg-border mt-2" />
      </div>
      <div className="pb-8 pt-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-primary">{icon}</span>
          <h3 className="font-bold text-foreground text-base">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-secondary border border-border">
        {icon}
      </div>
      <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNavigation />

      <main className="flex-1 container mx-auto max-w-4xl p-6 md:p-10 space-y-14">
        {/* ── Hero ── */}
        <section className="text-center space-y-5 pt-4">
          <div className="inline-flex items-center gap-2 bg-secondary text-foreground/80 border border-border px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em]">
            <Lightbulb className="w-3.5 h-3.5" />
            SAP Sales & Consulting Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.05]">
            What is{" "}
            <span className="italic font-serif font-normal text-primary">
              Smart IP Advisor
            </span>
            ?
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Smart IP Advisor is an AI-powered tool that helps SAP sales and
            consulting teams instantly surface the most relevant IP solutions
            from customer conversations — turning meeting transcripts into
            targeted recommendations and ready-to-send pitches.
          </p>
        </section>

        {/* ── The Problem ── */}
        <section className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              The Problem It Solves
            </h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            SAP has a large library of pre-built IP solutions, accelerators, and
            extensions — but connecting the right IP to the right customer at
            the right moment is hard. Sales teams often miss opportunities
            because they don't know which IP applies, or they spend hours
            manually reviewing solution catalogs after every discovery call.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
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
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="bg-secondary/60 border border-border rounded-xl p-4 text-sm text-foreground/80 leading-relaxed flex gap-2"
              >
                <span className="mt-0.5 shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">How It Works</h2>
          </div>
          <div>
            <Step
              number={1}
              icon={<FileText className="w-4 h-4" />}
              title="Paste or upload a meeting transcript"
              description="After a discovery call or workshop, paste the conversation transcript directly into the analyzer. The tool accepts raw text from any meeting recording, notes, or chat export."
            />
            <Step
              number={2}
              icon={<Search className="w-4 h-4" />}
              title="AI extracts business context"
              description="The AI reads the transcript and automatically identifies the customer's business problems, industry, SAP modules mentioned, and key topics — building a structured understanding of the customer's needs."
            />
            <Step
              number={3}
              icon={<BarChart3 className="w-4 h-4" />}
              title="IP catalog is scored and ranked"
              description="Every IP in the catalog is scored against the extracted context using a weighted algorithm: keywords (40%), business problems (30%), SAP modules (20%), and industry fit (10%). The top 3 matches are surfaced."
            />
            <Step
              number={4}
              icon={<Lightbulb className="w-4 h-4" />}
              title="AI generates personalized reasoning and pitches"
              description="For each recommended IP, the AI writes a specific explanation of why it fits this customer and a customer-ready sales pitch tailored to their pain points — ready to use in the next conversation."
            />
            <Step
              number={5}
              icon={<Mail className="w-4 h-4" />}
              title="Generate a personalized email pitch"
              description="With one click, generate a full email — subject line and body — personalised to the customer and the recommended IP. Copy it straight to your email client and send."
            />
          </div>
        </section>

        {/* ── Key Features ── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Key Features</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Feature
              icon={<Zap className="w-5 h-5 text-primary" />}
              title="Instant AI Analysis"
              description="Paste a transcript and get structured business insights plus ranked IP recommendations in seconds — no manual effort required."
            />
            <Feature
              icon={<BarChart3 className="w-5 h-5 text-primary" />}
              title="Scored Recommendations"
              description="Each recommendation comes with a match score and rating (Strong / Good / Possible Match) so you know where to focus first."
            />
            <Feature
              icon={<Mail className="w-5 h-5 text-primary" />}
              title="Email Pitch Generator"
              description="Generate a complete, personalized follow-up email for any recommended IP — tailored to the customer's context with a compelling subject and body."
            />
            <Feature
              icon={<Database className="w-5 h-5 text-primary" />}
              title="Managed IP Catalog"
              description="Browse, search, and filter the full IP library. Add new IPs manually or upload them in bulk via Excel. Edit or delete entries at any time."
            />
            <Feature
              icon={<Upload className="w-5 h-5 text-primary" />}
              title="Document Attachments"
              description="Attach supporting documents — PDFs, presentations, specs — to each IP entry so all relevant materials are always in one place."
            />
            <Feature
              icon={<Search className="w-5 h-5 text-primary" />}
              title="Search & View Modes"
              description="Find any IP instantly with real-time search across names, modules, industries, and keywords. Switch between grid and list views to suit your workflow."
            />
          </div>
        </section>

        {/* ── Who Is It For ── */}
        <section className="bg-secondary/50 border border-border rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Who Is It For?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
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
            ].map(({ role, desc }) => (
              <div
                key={role}
                className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-1.5"
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
        </section>
      </main>
    </div>
  );
}
