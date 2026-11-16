import type { IntervalTime, Schedule } from "../types/scedule.types";
import type { Course } from "../types/course.types";

const SUBJECT_REGEX =
  /^(\S+)\s+(\d{9})\s+(.+?)\s+(IF-\w+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.+)$/;

const LECTURER_SEPARATOR = /\s*(?:;|\/|\s&\s|\sdan\s)\s*/i;

const NOISE_REGEX =
  /^(halaman|page|hal\.?|no\.?|kode|nama|dosen|jadwal|semester|total)\b/i;

type RawCourse = Omit<Course, "id">;
type RawSchedule = Omit<Schedule, "id" | "course"> & { course: RawCourse };

type ParsedLine =
  | { type: "schedule"; data: RawSchedule }
  | { type: "lecturers"; names: string[] }
  | { type: "unknown" };

const normalizeName = (name: string): string =>
  name.replace(/\s+/g, " ").trim();

const looksLikeLecturer = (line: string): boolean =>
  /\p{L}{2,}/u.test(line) &&
  !/^[\d\s\W]+$/u.test(line) &&
  !NOISE_REGEX.test(line) &&
  line.length <= 120;

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

  if (looksLikeLecturer(line)) {
    const names = line
      .split(LECTURER_SEPARATOR)
      .map(normalizeName)
      .filter((name) => name.length > 0);

    if (names.length > 0) return { type: "lecturers", names };
  }

  return { type: "unknown" };
};

const reduceLines = (schedules: RawSchedule[], line: string): RawSchedule[] => {
  const parsed = parseLine(line);

  switch (parsed.type) {
    case "schedule":
      return [...schedules, parsed.data];

    case "lecturers": {
      if (schedules.length === 0) return schedules;
      const last = schedules[schedules.length - 1];
      const added = parsed.names.filter(
        (name) => !last.lecturers.includes(name),
      );
      if (added.length === 0) return schedules;
      return [
        ...schedules.slice(0, -1),
        { ...last, lecturers: [...last.lecturers, ...added] },
      ];
    }

    default:
      return schedules;
  }
};

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
