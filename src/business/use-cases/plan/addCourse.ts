import {
  addSubjectToPlan,
  getPlanById,
} from "../../../data/repository/planRepository";
import {
  getSubjectsOfDataSource,
  getActiveDataSourceId,
} from "../../../data/repository/dataSourceRepository";
import { checkScheduleConflict } from "../checkScheduleConflict";
import type { Plan, PlanData, UnavailableCourse } from "../../types/plan.types";
import type { Course } from "../../types/course.types";
import type { ConflictResult } from "../checkScheduleConflict";

export interface AddCourseInput {
  planId: string;
  courseId: number;
}

export interface AddCourseResult {
  success: boolean;
  plan?: Plan;
  conflict?: ConflictResult;
  error?: string;
}

/**
 * Menghitung ulang state data bucket Plan (choosed, available, unavailable)
 * berdasarkan daftar seluruh mata kuliah di datasource dan mata kuliah yang terpilih.
 */
export const calculatePlanData = (
  allCourses: Course[],
  choosedIds: number[]
): PlanData => {
  const choosedCourses = allCourses.filter((c) => choosedIds.includes(c.id));
  const choosedCourseCodes = new Set(choosedCourses.map((c) => c.code));

  const available: number[] = [];
  const unavailable: UnavailableCourse[] = [];

  for (const course of allCourses) {
    if (choosedIds.includes(course.id)) {
      continue;
    }

    const reasons: string[] = [];

    // 1. Cek apakah mata kuliah dengan kode yang sama sudah dipilih (kelas lain)
    if (choosedCourseCodes.has(course.code)) {
      reasons.push("Mata kuliah sudah dipilih pada kelas lain");
    }

    // 2. Cek apakah ada jadwal yang bentrok (waktu/ruang/dosen)
    const conflictResult = checkScheduleConflict(course, choosedCourses);
    if (conflictResult.hasConflict) {
      for (const conflict of conflictResult.conflicts) {
        const conflictReasons = conflict.reasons.map((r) => {
          if (r === "time") return `Bentrok waktu dengan ${conflict.subject.name} (${conflict.subject.className})`;
          if (r === "room") return `Ruangan sama dengan ${conflict.subject.name} (${conflict.subject.className})`;
          return `Dosen bersamaan dengan ${conflict.subject.name} (${conflict.subject.className})`;
        });
        reasons.push(...conflictReasons);
      }
    }

    if (reasons.length > 0) {
      unavailable.push({
        id: course.id,
        reason: reasons,
      });
    } else {
      available.push(course.id);
    }
  }

  return {
    choosed: choosedIds,
    available,
    unavailable,
  };
};

/**
 * Use case: Tambah mata kuliah (course) ke dalam plan.
 *
 * Validasi dan alur:
 * - Plan harus ada.
 * - Course tidak boleh sudah ada di plan (`plan.data.choosed`).
 * - Cek bentrok jadwal dan duplikasi kode mata kuliah terhadap course yang sudah dipilih.
 *   Jika bentrok, kembalikan conflict info tanpa menambahkan.
 * - Jika aman, tambahkan courseId ke `plan.data.choosed`, update `plan.choosedCourses`,
 *   serta hitung ulang status `available` dan `unavailable`.
 */
export const addCourse = (input: AddCourseInput): AddCourseResult => {
  const { planId, courseId } = input;

  const plan = getPlanById(planId);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const currentChoosed = plan.data?.choosed ?? [];

  // Cek apakah course sudah ada di plan
  if (currentChoosed.includes(courseId)) {
    return { success: false, error: "Mata kuliah sudah ada di plan ini." };
  }

  // Ambil semua courses dari data source plan atau data source aktif
  const dsId = plan.datasourceId ?? getActiveDataSourceId();
  if (!dsId) {
    return { success: false, error: "Tidak ada data source yang aktif." };
  }

  const allCourses = getSubjectsOfDataSource(dsId);
  const courseToAdd = allCourses.find((c) => c.id === courseId);
  if (!courseToAdd) {
    return { success: false, error: "Mata kuliah tidak ditemukan di data source." };
  }

  // Ambil courses yang sudah dipilih di plan
  const choosedCourses = allCourses.filter((c) => currentChoosed.includes(c.id));

  // Cek apakah mata kuliah dengan kode yang sama sudah dipilih
  const sameCodeCourse = choosedCourses.find((c) => c.code === courseToAdd.code);
  if (sameCodeCourse) {
    return {
      success: false,
      error: `Mata kuliah ${courseToAdd.name} sudah dipilih pada kelas ${sameCodeCourse.className}.`,
    };
  }

  // Cek bentrok jadwal
  const conflictResult = checkScheduleConflict(courseToAdd, choosedCourses);
  if (conflictResult.hasConflict) {
    return {
      success: false,
      conflict: conflictResult,
      error: "Jadwal bentrok dengan mata kuliah yang sudah dipilih.",
    };
  }

  // Hitung ulang data bucket (choosed, available, unavailable)
  const nextChoosed = [...currentChoosed, courseId];
  const updatedPlanData = calculatePlanData(allCourses, nextChoosed);

  // Simpan perubahan ke plan repository
  const updated = addSubjectToPlan(
    planId,
    courseId,
    courseToAdd.code,
    updatedPlanData
  );

  if (!updated) {
    return { success: false, error: "Gagal menyimpan perubahan plan." };
  }

  return { success: true, plan: updated };
};
