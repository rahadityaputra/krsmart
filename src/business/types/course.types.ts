import type { Schedule } from "./scedule.types";

export interface Course {
    id: number;
    studyProgram: string;
    code: string;
    name: string;
    credits: number;
    className: string;
    numberOfStudent: number;
    schedule: Schedule;
    classRoom: string;
    lecturers: string[];
}
