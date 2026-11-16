import type { IntervalTime, Schedule } from "../types/scedule.types";
import type { Course } from "../types/course.types";

type RawCourse = Omit<Course, "id">;
type RawSchedule = Omit<Schedule, "id" | "course"> & { course: RawCourse };

const TIME_REGEX = /^([A-Za-z]+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/;

const isIntegerString = (value: string | undefined): boolean =>
  value !== undefined && /^-?\d+$/.test(value);

const parseScheduleCells = (cells: string[]): RawSchedule | null => {
  if (cells.length < 8) return null;

  let creditIndex = 3;
  let classNameIndex = 4;
  if (!isIntegerString(cells[creditIndex])) {
    [creditIndex, classNameIndex] = [classNameIndex, creditIndex];
  }
  if (!isIntegerString(cells[creditIndex])) return null;

  const time = cells[6].match(TIME_REGEX);
  if (!time) return null;

  const [, day, start, end] = time;
  const intervalTime: IntervalTime = { start, end };

  return {
    course: {
      studyProgram: cells[0],
      code: cells[1],
      name: cells[2],
      credits: parseInt(cells[creditIndex], 10),
    },
    className: cells[classNameIndex],
    numberOfStudent: parseInt(cells[5], 10) || 0,
    day,
    intervalTime,
    classRoom: cells[7],
    lecturers: [],
  };
};

const parseLines = (lines: string[]): RawSchedule[] => {
  const schedules: RawSchedule[] = [];
  let key = "";

  for (const line of lines) {
    const cells = line.split("\t").map((cell) => cell.trim());
    const first = cells[0];

    if (key === "") {
      const schedule = parseScheduleCells(cells);
      if (schedule) {
        key = first;
        schedules.push(schedule);
      }
      continue;
    }

    if (first === key) {
      const schedule = parseScheduleCells(cells);
      if (schedule) schedules.push(schedule);
      continue;
    }

    const last = schedules[schedules.length - 1];
    if (first && !last.lecturers.includes(first)) {
      last.lecturers.push(first);
    }
  }

  return schedules;
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
    parseLines(raw.split(/\r?\n/).filter((line) => line.trim().length > 0)),
  );
