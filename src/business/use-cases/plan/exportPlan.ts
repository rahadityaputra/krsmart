import type { Plan } from "../../types/plan.types";
import type { Schedule } from "../../types/scedule.types";

export const KRS_FORMAT = "krs";
export const KRS_VERSION = 1;
export const KRS_EXTENSION = ".krs";
export const KRS_MIME = "application/json";

export interface PlanSource {
  name: string;
  schedules: Schedule[];
}

export interface KrsScheduleEntry {
  key: string;
  code: string;
  name: string;
  className: string;
  credits: number;
  day: string;
  start: string;
  end: string;
  classRoom: string;
  lecturers: string[];
}

export interface KrsFile {
  format: typeof KRS_FORMAT;
  version: number;
  exportedAt: string;
  plan: {
    name: string;
    courses: string[];
  };
  source: { name: string };
  schedules: KrsScheduleEntry[];
}

export const scheduleKey = (item: Schedule): string =>
  `${item.course.code}|${item.className}`;

export interface ExportPlanResult {
  success: boolean;
  fileName?: string;
  content?: string;
  mimeType?: string;
  error?: string;
}

const toFileName = (name: string): string => {
  const safe = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-");
  return `${safe || "rencana-krs"}${KRS_EXTENSION}`;
};

export const exportPlan = (
  plan: Plan,
  source: PlanSource | undefined,
): ExportPlanResult => {
  if (!plan.name.trim()) {
    return { success: false, error: "Nama plan tidak boleh kosong." };
  }
  if (!source) {
    return { success: false, error: "Data source tidak ditemukan." };
  }

  const chosenIds = new Set(plan.data?.choosed ?? []);
  const chosen = source.schedules.filter((item) => chosenIds.has(item.id));

  const courses = [
    ...new Set([
      ...(plan.choosedCourses ?? []),
      ...chosen.map((item) => item.course.code),
    ]),
  ];

  const file: KrsFile = {
    format: KRS_FORMAT,
    version: KRS_VERSION,
    exportedAt: new Date().toISOString(),
    plan: { name: plan.name, courses },
    source: { name: source.name },
    schedules: chosen.map((item) => ({
      key: scheduleKey(item),
      code: item.course.code,
      name: item.course.name,
      className: item.className,
      credits: item.course.credits,
      day: item.day,
      start: item.intervalTime.start,
      end: item.intervalTime.end,
      classRoom: item.classRoom,
      lecturers: item.lecturers,
    })),
  };

  return {
    success: true,
    fileName: toFileName(plan.name),
    content: JSON.stringify(file, null, 2),
    mimeType: KRS_MIME,
  };
};

export const downloadKrs = (result: ExportPlanResult): void => {
  if (!result.success || !result.content || !result.fileName) return;
  const blob = new Blob([result.content], {
    type: result.mimeType ?? KRS_MIME,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
};
