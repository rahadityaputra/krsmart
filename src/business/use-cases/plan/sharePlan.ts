import { getPlanById } from "../../../data/repository/planRepository";
import {
  getSubjectsOfDataSource,
  getActiveDataSourceId,
} from "../../../data/repository/dataSourceRepository";

export interface SharePlanResult {
  success: boolean;
  shareText?: string;
  error?: string;
}

/**
 * Use case: Bagikan plan sebagai teks yang mudah di-copy.
 *
 * Menghasilkan teks rangkuman jadwal yang dipilih, meliputi
 * nama plan, daftar mata kuliah, jadwal, dan total SKS.
 */
export const sharePlan = (id: string): SharePlanResult => {
  const plan = getPlanById(id);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const activeId = getActiveDataSourceId();
  if (!activeId) {
    return { success: false, error: "Tidak ada data source yang aktif." };
  }

  const allSubjects = getSubjectsOfDataSource(activeId);
  const choosedSubjects = allSubjects.filter((s) => plan.subjectIds.includes(s.id));

  if (choosedSubjects.length === 0) {
    return {
      success: true,
      shareText: `📋 ${plan.name}\n\nBelum ada mata kuliah yang dipilih.`,
    };
  }

  const totalCredits = choosedSubjects.reduce((sum, s) => sum + s.credits, 0);

  const lines = choosedSubjects.map(
    (s) =>
      `• ${s.name} (${s.className}) — ${s.credits} SKS\n  ${s.schedule.day} ${s.schedule.intervalTime.start}-${s.schedule.intervalTime.end} | ${s.classRoom}`
  );

  const shareText = [
    `📋 ${plan.name}`,
    `Total: ${choosedSubjects.length} mata kuliah, ${totalCredits} SKS`,
    "",
    ...lines,
  ].join("\n");

  return { success: true, shareText };
};
