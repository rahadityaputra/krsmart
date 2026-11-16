import {
  getAllViews,
  getViewById,
} from "../../../data/repository/viewRepository";
import { getPlanById } from "../../../data/repository/planRepository";
import type {
  View,
  ResolvedView,
} from "../../../data/repository/viewRepository";
import type { Plan } from "../../types/plan.types";

export const getViews = (): View[] => {
  return getAllViews();
};

export const getView = (id: string): View | null => {
  return getViewById(id);
};

export const getResolvedView = (id: string): ResolvedView | null => {
  const view = getViewById(id);
  if (!view) return null;

  const plans = view.planIds
    .map((planId) => getPlanById(planId))
    .filter((plan): plan is Plan => plan !== null);

  return { ...view, plans };
};
