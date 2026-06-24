import { generateObject, type CoreMessage } from "ai";
import { z } from "zod";
import { getFastModel } from "../index";

const clarificationOutputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("question"),
    question: z.string().describe("The next question to ask the user to clarify their feature request."),
  }),
  z.object({
    type: z.literal("context_ready"),
    summary: z.string().describe("A comprehensive summary of the gathered requirements, ready for PRD generation."),
  }),
]);

export async function runClarificationTurn(
  messages: CoreMessage[],
  roundCount: number,
  hardCap: number
) {
  const model = getFastModel();

  const systemMessage: CoreMessage = {
    role: "system",
    content: `You are an expert product manager tasked with clarifying a user's feature request.
Your goal is to gather enough context to write a comprehensive Product Requirements Document (PRD).

Guidelines:
1. Ask ONE clear, specific question at a time.
2. If the user provides a vague or unhelpful answer (e.g., "not sure", "you decide"), acknowledge it gracefully and either ask a different question or make a reasonable assumption. Do NOT repeat the exact same question.
3. Once you feel you have enough context to write a good PRD, or if the user indicates they have nothing more to add, signal "context_ready" and provide a comprehensive summary of all the requirements gathered so far.
4. This is round ${roundCount + 1} out of a maximum of ${hardCap} rounds.
${
  roundCount + 1 >= hardCap
    ? `WARNING: This is the final round. You MUST output "context_ready" and summarize what you have, regardless of completeness.`
    : `If you have asked enough questions, feel free to wrap up early.`
}`,
  };

  const { object } = await generateObject({
    model,
    schema: clarificationOutputSchema,
    messages: [systemMessage, ...messages],
    temperature: 0.7,
  });

  return object;
}
