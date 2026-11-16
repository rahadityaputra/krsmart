import type { Plan } from "../../types/plan.types";
import { calculatePlanData } from "./addSchedule";
import {
  KRS_FORMAT,
  KRS_VERSION,
  scheduleKey,
  type KrsFile,
  type PlanSource,
} from "./exportPlan";

export interface ImportPlanResult {
  success: boolean;
  /** Plan baru yang siap disimpan (id baru, datasourceId = tujuan). */
  plan?: Plan;
  /** Jadwal di file yang tidak ditemukan di data source tujuan. */
  missing?: { code: string; name: string; className: string }[];
  warnings?: string[];
  error?: string;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isKrsFile = (value: unknown): value is KrsFile => {
  if (typeof value !== "object" || value === null) return false;
  const file = value as Partial<KrsFile>;

  if (
    file.format !== KRS_FORMAT ||
    !Number.isInteger(file.version) ||
    typeof file.exportedAt !== "string" ||
    typeof file.plan !== "object" ||
    !Array.isArray(file.schedules)
  ) {
    return false;
  }

  const plan = file.plan;
  return (
    typeof plan.name === "string" &&
    plan.name.trim().length > 0 &&
    isStringArray(plan.courses) &&
    file.schedules.every(
      (entry) =>
        typeof entry.key === "string" &&
        typeof entry.code === "string" &&
        typeof entry.name === "string" &&
        typeof entry.className === "string" &&
        typeof entry.credits === "number" &&
        typeof entry.day === "string" &&
        typeof entry.start === "string" &&
        typeof entry.end === "string" &&
        typeof entry.classRoom === "string" &&
        isStringArray(entry.lecturers),
    )
  );
};

const newPlanId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Use case: Import isi file .krs, cocokkan dengan data source tujuan,
 * lalu hasilkan objek Plan baru.
 *
 * Fungsi ini murni (tidak menyimpan apa pun). Pemanggil menyimpan
 * `result.plan` lewat repository/workspace.
 *
 * @param content       isi file .krs (string JSON)
 * @param source        data source tujuan
 * @param datasourceId  id data source tujuan (disimpan ke Plan.datasourceId)
 */
export const importPlan = (
  content: string,
  source: PlanSource | undefined,
  datasourceId: string,
): ImportPlanResult => {
  if (!datasourceId.trim()) {
    return {
      success: false,
      error: "ID data source tujuan tidak boleh kosong.",
    };
  }
  if (!source) {
    return { success: false, error: "Data source tujuan tidak ditemukan." };
  }
  if (!content.trim()) {
    return { success: false, error: "File .krs kosong." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { success: false, error: "File .krs tidak valid (bukan JSON)." };
  }

  if (!isKrsFile(parsed)) {
    return { success: false, error: "Format file .krs tidak dikenali." };
  }
  if (parsed.version > KRS_VERSION) {
    return {
      success: false,
      error: `Versi file (${parsed.version}) lebih baru dari yang didukung (${KRS_VERSION}).`,
    };
  }

  const byKey = new Map(
    source.schedules.map((item) => [scheduleKey(item), item]),
  );
  const knownCodes = new Set(source.schedules.map((item) => item.course.code));

  const choosed: number[] = [];
  const missing: NonNullable<ImportPlanResult["missing"]> = [];

  for (const entry of parsed.schedules) {
    const match = byKey.get(`${entry.code}|${entry.className}`);
    if (match) {
      if (!choosed.includes(match.id)) choosed.push(match.id);
    } else {
      missing.push({
        code: entry.code,
        name: entry.name,
        className: entry.className,
      });
    }
  }

  // Hanya simpan kode MK yang ada di data source tujuan
  const choosedCourses = parsed.plan.courses.filter((code) =>
    knownCodes.has(code),
  );

  const warnings: string[] = [];
  if (parsed.source.name && parsed.source.name !== source.name) {
    warnings.push(
      `File dibuat dari data source "${parsed.source.name}", sedangkan tujuan "${source.name}".`,
    );
  }
  if (choosedCourses.length < parsed.plan.courses.length) {
    warnings.push(
      `${parsed.plan.courses.length - choosedCourses.length} mata kuliah tidak ada di data source tujuan.`,
    );
  }
  if (missing.length > 0) {
    warnings.push(`${missing.length} jadwal tidak ditemukan dan dilewati.`);
  }

  const now = Date.now();
  const plan: Plan = {
    id: newPlanId(),
    createdAt: now,
    updatedAt: now,
    name: parsed.plan.name,
    datasourceId,
    choosedCourses,
    data: calculatePlanData(source.schedules, choosed),
  };

  return { success: true, plan, missing, warnings };
};

/** Helper browser: baca File dari <input type="file" accept=".krs"> */
export const readKrsFile = (file: File): Promise<string> => file.text();
