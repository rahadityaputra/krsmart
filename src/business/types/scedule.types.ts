export interface IntervalTime {
    start: string;
    end: string;           
}

export interface Schedule {
    day: string;
    intervalTime: IntervalTime;
}