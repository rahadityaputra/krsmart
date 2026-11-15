import { FunctionsHttpError } from "@supabase/supabase-js";
import type { AppSupabaseClient } from "../supabaseClient";
import type {
  GeneratedSchedule,
  ScheduleGenerator,
} from "../../business/interfaces/ScheduleGenerator";

const FUNCTION_NAME = "generate-schedule";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isGeneratedSchedule = (value: unknown): value is GeneratedSchedule =>
  isRecord(value) &&
  Array.isArray(value.schedules) &&
  value.schedules.every(
    (item) => isRecord(item) && typeof item.id === "number",
  ) &&
  (value.reasoning === undefined || typeof value.reasoning === "string");

const extractErrorMessage = async (error: unknown): Promise<string> => {
  if (error instanceof FunctionsHttpError) {
    const context: unknown = error.context;
    if (context instanceof Response) {
      try {
        const body: unknown = await context.json();
        if (isRecord(body) && typeof body.error === "string") return body.error;
      } catch {
        // body bukan JSON, pakai pesan default di bawah
      }
    }
  }
  return error instanceof Error
    ? error.message
    : "Gagal menghubungi layanan AI.";
};

export const createSupabaseScheduleGenerator = (
  client: AppSupabaseClient,
): ScheduleGenerator => ({
  generate: async (request) => {
    const response = await client.functions.invoke<unknown>(FUNCTION_NAME, {
      body: request,
    });
    const data: unknown = response.data;
    const error: unknown = response.error;

    if (error) {
      return { ok: false, error: await extractErrorMessage(error) };
    }
    if (!isGeneratedSchedule(data)) {
      return {
        ok: false,
        error: "Format respons dari layanan AI tidak dikenali.",
      };
    }
    return { ok: true, data };
  },
});
