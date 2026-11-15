export interface UnavailableCourse {
  id: number;
  reason: string[];
}

export interface PlanData {
  choosed: number[];
  available: number[];
  unavailable: UnavailableCourse[];
}

export interface Plan {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  datasourceId?: string;
  choosedCourses?: string[];
  data?: PlanData;
}