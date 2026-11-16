import { supabase } from "./data/supabaseClient";
import { createSupabaseScheduleGenerator } from "./data/services/supabaseScheduleGenerator";
import {
  createGeneratePlanWithAI,
  type GeneratePlanWithAI,
} from "./business/use-cases/plan/generatePlanWithAi";

export const generatePlanWithAI: GeneratePlanWithAI = createGeneratePlanWithAI({
  generator: createSupabaseScheduleGenerator(supabase),
});
