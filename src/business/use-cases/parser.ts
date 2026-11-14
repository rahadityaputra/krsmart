import type { IntervalTime } from "../types/scedule.types";
import type { Course } from "../types/course.types";

const SUBJECT_REGEX =
    /^(\S+)\s+(\d{9})\s+(.+?)\s+(IF-\w+)\s+(\d+)\s+(\d+)\s+([A-Za-z]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})\s+(.+)$/;

// Contoh baris: "Dosen 001"
const LECTURER_REGEX = /^Dosen\s+\d+$/;

type ParsedLine =
    | { type: "subject"; data: Omit<Course, "id"> }
    | { type: "lecturer"; name: string }
    | { type: "unknown" };

const parseLine = (line: string): ParsedLine => {
    const subjectMatch = line.match(SUBJECT_REGEX);
    if (subjectMatch) {
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
        ] = subjectMatch;

        const intervalTime: IntervalTime = {
            start: start,
            end: end
        }

        return {
            type: "subject",
            data: {
                studyProgram,
                code,
                name: name.trim(),
                credits: Number(credits),
                className,
                numberOfStudent: Number(numberOfStudent),
                schedule: { day, intervalTime },
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

const reduceLines = (
    subjects: Omit<Course, "id">[],
    line: string
): Omit<Course, "id">[] => {
    const parsed = parseLine(line);

    switch (parsed.type) {
        case "subject":
            return [...subjects, parsed.data];

        case "lecturer": {
            if (subjects.length === 0) return subjects;
            const last = subjects[subjects.length - 1];
            return [
                ...subjects.slice(0, -1),
                { ...last, lecturers: [...last.lecturers, parsed.name] },
            ];
        }

        default:
            return subjects;
    }
};

export const parseSubjects = (raw: string): Course[] =>
    raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .reduce(reduceLines, [] as Omit<Course, "id">[])
        .map((subject, index) => ({ id: index + 1, ...subject }));