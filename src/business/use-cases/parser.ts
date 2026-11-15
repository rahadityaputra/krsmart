import type { IntervalTime, Schedule } from "../types/scedule.types";
import type { Course } from "../types/course.types";

const SUBJECT_REGEX =
  /^(\S+)\s+(\d{9})\s+(.+?)\s+(IF-\w+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.+)$/;

const LECTURER_REGEX = /^Dosen\s+\d+$/;

type RawCourse = Omit<Course, "id">;
type RawSchedule = Omit<Schedule, "id" | "course"> & { course: RawCourse };

type ParsedLine =
  | { type: "schedule"; data: RawSchedule }
  | { type: "lecturer"; name: string }
  | { type: "unknown" };

const parseLine = (line: string): ParsedLine => {
  const match = line.match(SUBJECT_REGEX);

  if (match) {
    const [
      ,
      studyProgram,
      code,
      name,
      className,
      credits,
      numberOfStudent,
      day,
      start,
      end,
      classRoom,
    ] = match;

    const intervalTime: IntervalTime = { start, end };

    return {
      type: "schedule",
      data: {
        course: {
          studyProgram,
          code,
          name: name.trim(),
          credits: Number(credits),
        },
        className,
        numberOfStudent: Number(numberOfStudent),
        day,
        intervalTime,
        classRoom: classRoom.trim(),
        lecturers: [],
      },
    };
  }

  if (LECTURER_REGEX.test(line)) {
    return { type: "lecturer", name: line };
  }

  return { type: "unknown" };
};

// Baris dosen selalu menempel ke jadwal terakhir sebelumnya
const reduceLines = (schedules: RawSchedule[], line: string): RawSchedule[] => {
  const parsed = parseLine(line);

  switch (parsed.type) {
    case "schedule":
      return [...schedules, parsed.data];

    case "lecturer": {
      if (schedules.length === 0) return schedules;
      const last = schedules[schedules.length - 1];
      return [
        ...schedules.slice(0, -1),
        { ...last, lecturers: [...last.lecturers, parsed.name] },
      ];
    }

    default:
      return schedules;
  }
};

// Beri id Course (unik per kode mata kuliah) dan id Schedule (per baris)
const assignIds = (rawSchedules: RawSchedule[]): Schedule[] => {
  const coursesByCode = new Map<string, Course>();

  return rawSchedules.map((raw, index) => {
    const { course: rawCourse, ...rest } = raw;

    const course: Course = coursesByCode.get(rawCourse.code) ?? {
      id: coursesByCode.size + 1,
      ...rawCourse,
    };
    coursesByCode.set(course.code, course);

    return { id: index + 1, ...rest, course };
  });
};

export const parseSubjects = (raw: string): Schedule[] =>
  assignIds(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .reduce<RawSchedule[]>(reduceLines, []),
  );
