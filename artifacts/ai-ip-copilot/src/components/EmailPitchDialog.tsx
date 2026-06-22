import { useState } from "react";
import { useGenerateEmailPitch } from "@workspace/api-client-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Copy,
  CheckCircle2,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EmailPitchDialog({
  open,
  onOpenChange,
  ipName,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ipName: string;
  reason: string;
}) {
  const [context, setContext] = useState("");
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const { toast } = useToast();
  const generatePitch = useGenerateEmailPitch();

  const handleGenerate = () => {
    if (!context.trim()) {
      toast({
        title: "Required",
        description: "Please provide customer context.",
        variant: "destructive",
      });
      return;
    }

    generatePitch.mutate({
      data: {
        ipName,
        customerContext: context,
        reason,
      },
    });
  };

  const handleCopy = (text: string, type: "subject" | "body") => {
    navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
    toast({
      title: "Copied",
      description: `${type === "subject" ? "Subject" : "Email body"} copied to clipboard.`,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          // Optional: clear state on close if desired, but we can keep it around
        }
      }}
    >
      <DialogContent className="sm:max-w-[650px] flex flex-col max-h-[90vh]">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-5 h-5 text-primary" />
            Generate Email Pitch
          </DialogTitle>
          <DialogDescription className="pt-1">
            Personalize the outreach for{" "}
            <span className="font-semibold text-foreground">{ipName}</span>.
          </DialogDescription>
        </DialogHeader>

        {!generatePitch.data ? (
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label
                htmlFor="context"
                className="text-sm font-semibold flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Customer Context
              </Label>
              <Textarea
                id="context"
                placeholder="E.g., Customer is a mid-sized manufacturer moving to S/4HANA next year, currently struggling with legacy master data quality..."
                className="min-h-[140px] resize-none text-sm leading-relaxed"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This context will guide the AI to focus on the specific pain
                points mentioned.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Subject Line
              </Label>
              <div className="flex gap-2">
                <div className="p-3 bg-muted/50 rounded-md text-sm font-semibold flex-1 border border-border/50 text-foreground">
                  {generatePitch.data.subject}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    handleCopy(generatePitch.data.subject, "subject")
                  }
                >
                  {copiedSubject ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Email Body
              </Label>
              <div className="relative group">
                <div className="p-5 bg-muted/30 rounded-md text-sm whitespace-pre-wrap font-sans border border-border/50 min-h-[220px] leading-relaxed text-foreground shadow-inner">
                  {generatePitch.data.body}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute top-2 right-2 shadow-sm bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopy(generatePitch.data.body, "body")}
                >
                  {copiedBody ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4 mt-auto">
          {!generatePitch.data ? (
            <div className="flex justify-end gap-3 w-full">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generatePitch.isPending || !context.trim()}
                className="font-semibold shadow-sm"
              >
                {generatePitch.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Generate Email
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => generatePitch.reset()}>
                Start Over
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="font-semibold"
              >
                Done
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
