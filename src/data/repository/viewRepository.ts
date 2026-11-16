import type { Plan } from "../../business/types/plan.types";
import { getItem, removeItem, setItem } from "../storage/localStorage";

export interface View {
  id: string;
  name: string;
  planIds: string[];
  createdAt: number;
  updatedAt: number;
}

export type NewView = Pick<View, "name"> & Partial<Pick<View, "planIds">>;
export type ViewChanges = Partial<Pick<View, "name" | "planIds">>;

export interface ResolvedView extends View {
  plans: Plan[];
}

const VIEWS_KEY = "schedule:views";

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadViews = (): View[] => getItem<View[]>(VIEWS_KEY, []);

const saveViews = (views: View[]): boolean => setItem(VIEWS_KEY, views);

const unique = <T>(items: T[]): T[] => [...new Set(items)];

export const getAllViews = (): View[] => loadViews();

export const getViewById = (id: string): View | null =>
  loadViews().find((view) => view.id === id) ?? null;

export const addView = (input: NewView): View | null => {
  const now = Date.now();
  const view: View = {
    id: generateId(),
    name: input.name.trim(),
    planIds: unique(input.planIds ?? []),
    createdAt: now,
    updatedAt: now,
  };

  return saveViews([...loadViews(), view]) ? view : null;
};

export const updateView = (id: string, changes: ViewChanges): View | null => {
  const views = loadViews();
  const target = views.find((view) => view.id === id);
  if (!target) return null;

  const updated: View = {
    ...target,
    ...(changes.name !== undefined && { name: changes.name.trim() }),
    ...(changes.planIds !== undefined && { planIds: unique(changes.planIds) }),
    updatedAt: Date.now(),
  };

  const saved = saveViews(
    views.map((view) => (view.id === id ? updated : view)),
  );
  return saved ? updated : null;
};

export const addPlanToView = (viewId: string, planId: string): View | null => {
  const view = getViewById(viewId);
  if (!view) return null;
  return updateView(viewId, { planIds: [...view.planIds, planId] });
};

export const removePlanFromView = (
  viewId: string,
  planId: string,
): View | null => {
  const view = getViewById(viewId);
  if (!view) return null;
  return updateView(viewId, {
    planIds: view.planIds.filter((id) => id !== planId),
  });
};

export const togglePlanInView = (
  viewId: string,
  planId: string,
): View | null => {
  const view = getViewById(viewId);
  if (!view) return null;
  return view.planIds.includes(planId)
    ? removePlanFromView(viewId, planId)
    : addPlanToView(viewId, planId);
};

export const removeView = (id: string): boolean => {
  const views = loadViews();
  const remaining = views.filter((view) => view.id !== id);
  if (remaining.length === views.length) return false;
  return saveViews(remaining);
};

export const clearViews = (): boolean => removeItem(VIEWS_KEY);
