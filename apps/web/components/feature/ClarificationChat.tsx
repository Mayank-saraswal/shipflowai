"use client";

import React, { useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Loader2, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  createdAt: Date | string;
}

interface ClarificationChatProps {
  messages: Message[];
  status: "active" | "awaiting_ai_response" | "context_ready" | "manual_review";
  roundCount: number;
  hardCap: number;
  onSubmitMessage: (content: string) => void;
  isSubmitting: boolean;
}

export function ClarificationChat({
  messages,
  status,
  roundCount,
  hardCap,
  onSubmitMessage,
  isSubmitting,
}: ClarificationChatProps) {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === "awaiting_ai_response" || isSubmitting) return;
    onSubmitMessage(input);
    setInput("");
  };

  const isComplete = status === "context_ready" || status === "manual_review";

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[70vh] border rounded-xl overflow-hidden bg-background shadow-sm">
      {/* Header / Stepper */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold">Feature Clarification</h3>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {status === "context_ready" ? (
            <span className="text-green-600 font-medium">Context Gathered</span>
          ) : status === "manual_review" ? (
            <span className="text-amber-600 font-medium">Needs PM Review</span>
          ) : (
            <>
              <span>Round {roundCount} of {hardCap}</span>
              <div className="flex gap-1">
                {Array.from({ length: hardCap }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 w-4 rounded-full ${i < roundCount ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ARIA Live region for screen readers to announce new AI messages */}
        <div aria-live="polite" className="sr-only">
          {messages.filter(m => m.role === "ai").pop()?.content || "Chat started."}
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted text-foreground border rounded-tl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
            </div>
          </div>
        ))}

        {status === "awaiting_ai_response" && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-muted border rounded-tl-sm text-muted-foreground text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your request...
            </div>
          </div>
        )}

        {status === "manual_review" && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200 text-sm">
            Thanks for the details! This request needs a bit more product thinking, so we've looped in your PM to review it manually. You don't need to do anything else right now.
          </Card>
        )}

        {status === "context_ready" && (
          <Card className="p-4 bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-200 text-sm font-medium">
            Great! We have enough context to draft a Product Requirements Document (PRD). It is being generated now.
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status === "awaiting_ai_response" || isSubmitting || isComplete}
            placeholder={isComplete ? "Conversation closed." : "Type your answer here..."}
            className="w-full pr-12 pl-4 py-3 rounded-full border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
            aria-label="Chat input"
          />
          <div className="absolute right-2 flex items-center">
            <div className="text-xs text-muted-foreground mr-2 font-mono hidden sm:block">
              {input.length}/5000
            </div>
            <Button 
              type="submit" 
              size="icon" 
              className="h-8 w-8 rounded-full" 
              disabled={!input.trim() || status === "awaiting_ai_response" || isSubmitting || isComplete}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
