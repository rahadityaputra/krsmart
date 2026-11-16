import { useRef } from "react";
import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { Schedule } from "../business/types/scedule.types";
import { dayLabel, days, hours, minutes, time } from "./components/schedule-utils";


export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className={`dialog-content ${wide ? "dialog-wide" : ""}`}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            if (document.activeElement instanceof HTMLElement)
              opener.current = document.activeElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <header className="dialog-header">
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="icon-button" aria-label="Close">
              ×
            </DialogPrimitive.Close>
          </header>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function CatalogTable({ schedules }: { schedules: Schedule[] }) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      aria-label="Lecturer schedule table"
    >
      <table>
        <thead>
          <tr>
            {[
              "Study Program",
              "Course Code",
              "Course Name",
              "Class",
              "Credits",
              "Students",
              "Schedule",
              "Room",
              "Lecturers",
            ].map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>{schedule.course.studyProgram}</td>
              <td>{schedule.course.code}</td>
              <td>{schedule.course.name}</td>
              <td>{schedule.className}</td>
              <td>{schedule.course.credits}</td>
              <td>{schedule.numberOfStudent}</td>
              <td>
                {dayLabel(schedule.day)} {time(schedule)}
              </td>
              <td>{schedule.classRoom}</td>
              <td>
                {schedule.lecturers.map((name) => (
                  <div key={name}>{name}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Calendar({
  schedules,
  onRemove,
}: {
  schedules: Schedule[];
  onRemove?: (schedule: Schedule) => void;
}) {
  const activeDays = schedules.some((schedule) => schedule.day === "Minggu")
    ? days
    : days.slice(0, 6);
  const first = Math.min(
    7,
    ...schedules.map((schedule) =>
      Math.floor(minutes(hours(schedule).start) / 60),
    ),
  );
  const last = Math.max(
    18,
    ...schedules.map((schedule) =>
      Math.ceil(minutes(hours(schedule).end) / 60),
    ),
  );
  const ticks = Array.from(
    { length: last - first },
    (_, index) => first + index,
  );
  const gapList = activeDays.flatMap((day) => {
    const ordered = schedules
      .filter((schedule) => schedule.day === day)
      .sort((a, b) => minutes(hours(a).start) - minutes(hours(b).start));
    return ordered.slice(1).map((schedule, i) => {
      const gap =
        minutes(hours(schedule).start) - minutes(hours(ordered[i]).end);
      return `${dayLabel(day)} ${hours(ordered[i]).end}–${hours(schedule).start} · ${gap} min`;
    });
  });
  return (
    <>
      <div
        className="calendar-scroll"
        tabIndex={0}
        aria-label="Weekly calendar, scroll to see all days"
      >
        <div
          className="calendar"
          style={{
            gridTemplateColumns: `58px repeat(${activeDays.length}, minmax(106px, 1fr))`,
          }}
        >
          <div className="calendar-label time-label">Time</div>
          {activeDays.map((day) => (
            <div key={day} className="calendar-label">
              {dayLabel(day)}
            </div>
          ))}
          <div className="time-axis">
            {ticks.map((hour) => (
              <div key={hour}>{String(hour).padStart(2, "0")}:00</div>
            ))}
          </div>
          {activeDays.map((day) => (
            <div
              className="calendar-day"
              key={day}
              style={{ height: ticks.length * 46 }}
            >
              {schedules
                .filter((schedule) => schedule.day === day)
                .map((schedule) => (
                  <article
                    key={schedule.id}
                    className={`calendar-card tone-${Number(schedule.course.code.slice(-2)) % 3}`}
                    style={{
                      top:
                        ((minutes(hours(schedule).start) - first * 60) * 46) /
                        60,
                      height:
                        ((minutes(hours(schedule).end) -
                          minutes(hours(schedule).start)) *
                          46) /
                          60 -
                        2,
                    }}
                  >
                    {onRemove && (
                      <button
                        type="button"
                        className="remove-card"
                        onClick={() => {
                          onRemove(schedule);
                        }}
                        aria-label={`Remove ${schedule.course.name} ${schedule.className}`}
                      >
                        ×
                      </button>
                    )}
                    <strong title={schedule.course.name}>
                      {schedule.course.name}
                    </strong>
                    <span>
                      {time(schedule)} · {schedule.course.credits} credits
                    </span>
                    <small title={schedule.lecturers.join(", ")}>
                      {schedule.lecturers.join(", ") || schedule.classRoom}
                    </small>
                  </article>
                ))}
            </div>
          ))}
        </div>
      </div>
      {gapList.length > 0 && (
        <details className="gaps">
          <summary>Gaps between classes</summary>
          <ul>
            {gapList.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export function ErrorText({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error">
      {message}
    </p>
  ) : null;
}
