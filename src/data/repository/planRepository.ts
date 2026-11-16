import type { Plan } from "../../business/types/plan.types";
import { getItem, removeItem, setItem } from "../storage/localStorage";

export type NewPlan = Pick<Plan, "name"> &
  Partial<Pick<Plan, "datasourceId" | "choosedCourses" | "data">>;
export type PlanChanges = Partial<
  Pick<Plan, "name" | "datasourceId" | "choosedCourses" | "data">
>;

const PLANS_KEY = "schedule:plans";

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadPlans = (): Plan[] => getItem<Plan[]>(PLANS_KEY, []);

const savePlans = (plans: Plan[]): boolean => setItem(PLANS_KEY, plans);

export const getAllPlans = (): Plan[] => loadPlans();

export const getPlanById = (id: string): Plan | null =>
  loadPlans().find((plan) => plan.id === id) ?? null;

export const addPlan = (input: NewPlan): Plan | null => {
  const now = Date.now();
  const plan: Plan = {
    id: generateId(),
    name: input.name.trim(),
    datasourceId: input.datasourceId,
    choosedCourses: input.choosedCourses
      ? [...new Set(input.choosedCourses)]
      : [],
    data: input.data ?? {
      choosed: [],
      available: [],
      unavailable: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  return savePlans([...loadPlans(), plan]) ? plan : null;
};

export const updatePlan = (id: string, changes: PlanChanges): Plan | null => {
  const plans = loadPlans();
  const target = plans.find((plan) => plan.id === id);
  if (!target) return null;

  const updated: Plan = {
    ...target,
    ...(changes.name !== undefined && { name: changes.name.trim() }),
    ...(changes.datasourceId !== undefined && {
      datasourceId: changes.datasourceId,
    }),
    ...(changes.choosedCourses !== undefined && {
      choosedCourses: [...new Set(changes.choosedCourses)],
    }),
    ...(changes.data !== undefined && { data: changes.data }),
    updatedAt: Date.now(),
  };

  const saved = savePlans(
    plans.map((plan) => (plan.id === id ? updated : plan)),
  );
  return saved ? updated : null;
};

export const addSubjectToPlan = (
  planId: string,
  courseId: number,
  courseCode?: string,
  planData?: Plan["data"],
): Plan | null => {
  const plan = getPlanById(planId);
  if (!plan) return null;

  const currentChoosed = plan.data?.choosed ?? [];
  const currentChoosedCourses = plan.choosedCourses ?? [];

  return updatePlan(planId, {
    choosedCourses: courseCode
      ? [...new Set([...currentChoosedCourses, courseCode])]
      : currentChoosedCourses,
    data: planData ?? {
      choosed: [...new Set([...currentChoosed, courseId])],
      available: plan.data?.available.filter((id) => id !== courseId) ?? [],
      unavailable: plan.data?.unavailable ?? [],
    },
  });
};

export const removeSubjectFromPlan = (
  planId: string,
  courseId: number,
  courseCode?: string,
  planData?: Plan["data"],
): Plan | null => {
  const plan = getPlanById(planId);
  if (!plan) return null;

  const currentChoosed = plan.data?.choosed ?? [];
  const currentChoosedCourses = plan.choosedCourses ?? [];

  return updatePlan(planId, {
    choosedCourses: courseCode
      ? currentChoosedCourses.filter((code) => code !== courseCode)
      : currentChoosedCourses,
    data: planData ?? {
      choosed: currentChoosed.filter((id) => id !== courseId),
      available: plan.data?.available ?? [],
      unavailable: plan.data?.unavailable ?? [],
    },
  });
};

export const removePlan = (id: string): boolean => {
  const plans = loadPlans();
  const remaining = plans.filter((plan) => plan.id !== id);
  if (remaining.length === plans.length) return false;
  return savePlans(remaining);
};

export const clearPlans = (): boolean => removeItem(PLANS_KEY);
