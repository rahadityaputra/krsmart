import type { Course } from "./course.types";

export interface UnavailableCourse {
  id: number;
  reason: string[];
}

/** State pemilihan kelas dalam sebuah plan */
export interface PlanData {
  choosed: number[];
  available: number[];
  unavailable: UnavailableCourse[];
}

/** Datasource: kumpulan data mata kuliah */
export interface Datasource {
  id: string;
  createdAt: string;
  name: string;
  datasource: Course[];
}

/** Plan sebagaimana tersimpan di localStorage */
export interface Plan {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  datasourceId?: string;
  choosedCourses?: string[];
  data?: PlanData;
}

/** Plan yang sudah di-enrich dengan data datasource (hasil dari getById) */
export interface EnrichedPlan extends Plan {
  datasource?: Datasource;
}
