import type { Course } from "./course.types";

export interface IntervalTime {
  start: string;
  end: string;
}

export interface Schedule {
  id: number;
  course: Course; 
  className: string; 
  numberOfStudent: number; 
  day: string;
  intervalTime: IntervalTime; 
  classRoom: string; 
  lecturers: string[];
}
