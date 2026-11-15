import type { ScheduleGenerator } from "../../interfaces/ScheduleGenerator";
import type { Schedule } from "../../types/scedule.types";
import { validateGeneratedSchedule, type ValidationIssue } from "../../vallidators/scheduleValidator";

export interface GeneratePlanWithAIInput {
  prompt: string;
  schedules: Schedule[];
}

export type GeneratePlanWithAIResult =
  | { success: true; schedules: Schedule[]; reasoning?: string }
  | { success: false; error: string; issues?: ValidationIssue[] };

export interface GeneratePlanWithAIDeps {
  generator: ScheduleGenerator;
}

export const createGeneratePlanWithAI =
  ({ generator }: GeneratePlanWithAIDeps) =>
  async ({ prompt, schedules }: GeneratePlanWithAIInput): Promise<GeneratePlanWithAIResult> => {
    if (prompt.trim().length === 0) {
      return { success: false, error: "Prompt tidak boleh kosong." };
    }
    if (schedules.length === 0) {
      return { success: false, error: "Daftar jadwal kosong." };
    }

    const generated = await generator.generate({ prompt: prompt.trim(), schedules });
    if (!generated.ok) {
      return { success: false, error: generated.error };
    }

    const validation = validateGeneratedSchedule(generated.data.schedules, schedules);
    if (!validation.valid) {
      return {
        success: false,
        error: "Jadwal dari AI tidak valid.",
        issues: validation.issues,
      };
    }

    return {
      success: true,
      schedules: validation.schedules,
      reasoning: generated.data.reasoning,
    };
  };

export type GeneratePlanWithAI = ReturnType<typeof createGeneratePlanWithAI>;