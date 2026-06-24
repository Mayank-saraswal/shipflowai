"use client";

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

interface DuplicateMatchCardProps {
  matches: Array<{ id: string; similarity: number }>;
  onDecision: (decision: "genuinely_different" | "confirmed_duplicate", duplicateOfId?: string) => void;
  isSubmitting: boolean;
}

export function DuplicateMatchCard({ matches, onDecision, isSubmitting }: DuplicateMatchCardProps) {
  // In a real app we'd fetch the actual PRD/Feature details using the match IDs.
  // For this implementation, we assume we have enough context or just show the top match's ID placeholder.
  const topMatch = matches[0];

  return (
    <Card className="w-full max-w-2xl mx-auto border-blue-500/20 bg-blue-500/5 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="text-blue-500">Wait, does this already exist?</span>
        </CardTitle>
        <CardDescription>
          We found an existing product requirement that looks very similar to your request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background rounded-md p-4 border text-sm">
          <div className="font-medium mb-1">Existing PRD/Feature ID: {topMatch?.id}</div>
          <div className="text-muted-foreground">
            (Similarity score: {((topMatch?.similarity || 0) * 100).toFixed(1)}%)
          </div>
          {/* Add actual matched title/description preview here based on fetched details */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="default" 
          className="w-full sm:w-auto"
          onClick={() => onDecision("confirmed_duplicate", topMatch?.id)}
          disabled={isSubmitting}
        >
          This is what I meant
        </Button>
        <Button 
          variant="outline" 
          className="w-full sm:w-auto"
          onClick={() => onDecision("genuinely_different")}
          disabled={isSubmitting}
        >
          No, this is genuinely different
        </Button>
      </CardFooter>
    </Card>
  );
}
