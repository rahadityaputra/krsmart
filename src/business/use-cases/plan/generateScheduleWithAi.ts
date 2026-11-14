import { getPlanById, updatePlan } from "../../../data/repository/planRepository";
import {
  getSubjectsOfDataSource,
  getActiveDataSourceId,
} from "../../../data/repository/dataSourceRepository";
import { checkScheduleConflict } from "../checkScheduleConflict";
import type { SchedulePlan } from "../../types/plan.types";
import type { Course } from "../../types/course.types";

export interface GenerateScheduleResult {
  success: boolean;
  plan?: SchedulePlan;
  selectedSubjects?: Course[];
  error?: string;
}

/**
 * Use case: Generate jadwal otomatis (greedy / heuristic sederhana).
 *
 * Strategi:
 * 1. Ambil semua subjects dari data source aktif.
 * 2. Kelompokkan berdasarkan nama mata kuliah.
 * 3. Untuk setiap mata kuliah, pilih kelas yang tidak bentrok
 *    dengan kelas yang sudah dipilih (greedy first-fit).
 * 4. Prioritaskan kelas dengan jumlah mahasiswa lebih sedikit (lebih kecil = lebih longgar).
 *
 * Catatan: Ini bukan AI sesungguhnya, melainkan heuristic sederhana.
 * Bisa diganti dengan AI model di kemudian hari.
 */
export const generateScheduleWithAi = (planId: string): GenerateScheduleResult => {
  const plan = getPlanById(planId);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const activeId = getActiveDataSourceId();
  if (!activeId) {
    return { success: false, error: "Tidak ada data source yang aktif." };
  }

  const allSubjects = getSubjectsOfDataSource(activeId);
  if (allSubjects.length === 0) {
    return { success: false, error: "Data source kosong." };
  }

  // Kelompokkan subjects berdasarkan nama mata kuliah
  const courseGroups = new Map<string, Course[]>();
  for (const subject of allSubjects) {
    const key = subject.name.toLowerCase().trim();
    const group = courseGroups.get(key) ?? [];
    group.push(subject);
    courseGroups.set(key, group);
  }

  // Greedy: untuk tiap mata kuliah, pilih kelas pertama yang tidak bentrok
  const selected: Course[] = [];

  for (const [, classes] of courseGroups) {
    // Sort by jumlah mahasiswa (ascending) sebagai heuristic
    const sorted = [...classes].sort((a, b) => a.numberOfStudent - b.numberOfStudent);

    for (const candidate of sorted) {
      const conflict = checkScheduleConflict(candidate, selected);
      if (!conflict.hasConflict) {
        selected.push(candidate);
        break; // ambil satu kelas per mata kuliah
      }
    }
  }

  // Update plan dengan subject yang terpilih
  const selectedIds = selected.map((s) => s.id);
  const updated = updatePlan(planId, { subjectIds: selectedIds });

  if (!updated) {
    return { success: false, error: "Gagal menyimpan hasil generate jadwal." };
  }

  return {
    success: true,
    plan: updated,
    selectedSubjects: selected,
  };
};
