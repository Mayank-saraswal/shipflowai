"use client";

import React, { useState } from "react";
import { trpc } from "~/trpc/client"; // Assuming tRPC React client is here or similar
import { DuplicateMatchCard } from "./DuplicateMatchCard";
import { ClarificationChat } from "./ClarificationChat";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts based on typical Vercel stacks

interface IntakeFlowProps {
  projectId: string;
}

export function IntakeFlow({ projectId }: IntakeFlowProps) {
  const [requestText, setRequestText] = useState("");
  const [view, setView] = useState<"initial" | "duplicate_check" | "clarifying">("initial");
  
  const [featureRequestId, setFeatureRequestId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Array<{ id: string; similarity: number }>>([]);

  // Setup tRPC hooks
  const submitInitial = trpc.feature.submitInitial.useMutation({
    onSuccess: (data) => {
      if (data.duplicateCheckRequired && "featureRequestId" in data) {
        setFeatureRequestId(data.featureRequestId!);
        setMatches(data.matches as { id: string; similarity: number }[]);
        setView("duplicate_check");
      } else if (!data.duplicateCheckRequired && "sessionId" in data) {
        setSessionId(data.sessionId!);
        setView("clarifying");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit request.");
    }
  });

  const submitMatchDecision = trpc.feature.submitMatchDecision.useMutation({
    onSuccess: (data) => {
      if (data.action === "redirect" && "targetId" in data) {
        toast.success("Redirecting to existing feature...");
        // In a real app, router.push(`/projects/${projectId}/features/${data.targetId}`);
        window.location.href = `/features/${data.targetId}`; // Fallback placeholder
      } else if (data.action !== "redirect" && "sessionId" in data) {
        setSessionId(data.sessionId!);
        setView("clarifying");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to process decision.");
    }
  });

  const submitMessage = trpc.feature.submitMessage.useMutation({
    onError: (err) => {
      toast.error(err.message || "Failed to send message.");
    }
  });

  // Short-polling for the session if in clarifying state
  const { data: sessionData } = trpc.feature.getSession.useQuery(
    { sessionId: sessionId! },
    { 
      enabled: !!sessionId && view === "clarifying",
      refetchInterval: 2000, // Poll every 2s to get AI updates
    }
  );

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestText.length < 10) {
      toast.error("Please provide at least 10 characters.");
      return;
    }
    submitInitial.mutate({ projectId, text: requestText });
  };

  const handleDecision = (decision: "genuinely_different" | "confirmed_duplicate", duplicateOfId?: string) => {
    if (!featureRequestId) return;
    submitMatchDecision.mutate({ featureRequestId, decision, duplicateOfId });
  };

  const handleSendMessage = (content: string) => {
    if (!sessionId) return;
    submitMessage.mutate({ sessionId, content });
  };

  if (view === "initial") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request a Feature</h1>
          <p className="text-muted-foreground mt-2">
            Describe what you need in as much detail as you can. Our AI PM will help clarify the rest.
          </p>
        </div>
        
        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <Textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="I want a way to export our dashboard to PDF so I can share it with clients..."
            className="min-h-[150px] resize-y text-base p-4"
            disabled={submitInitial.isPending}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitInitial.isPending || requestText.length < 10}>
              {submitInitial.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (view === "duplicate_check") {
    return (
      <div className="pt-8">
        <DuplicateMatchCard 
          matches={matches} 
          onDecision={handleDecision} 
          isSubmitting={submitMatchDecision.isPending}
        />
      </div>
    );
  }

  if (view === "clarifying") {
    const messages = sessionData?.messages || [];
    const status = sessionData?.session.status || "active";
    const roundCount = sessionData?.session.roundCount || 0;
    
    // Add optimistic user message if pending
    if (submitMessage.isPending && submitMessage.variables) {
      messages.push({
        id: "temp-id",
        role: "user",
        content: submitMessage.variables.content,
        createdAt: new Date() as any,
        sessionId: sessionId!,
        organizationId: "temp",
      });
    }

    return (
      <div className="pt-4">
        <ClarificationChat
          messages={messages}
          status={submitMessage.isPending ? "awaiting_ai_response" : status}
          roundCount={roundCount}
          hardCap={5}
          onSubmitMessage={handleSendMessage}
          isSubmitting={submitMessage.isPending}
        />
      </div>
    );
  }

  return null;
}
