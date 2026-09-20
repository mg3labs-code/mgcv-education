import { describe, expect, it } from "vitest";
import { addHolidayToSchedule, type ScheduleItem } from "@/components/teacher/TeachingCalendar";

describe("teaching calendar date persistence", () => {
  it("keeps a hand-edited Saturday when a holiday is added elsewhere", () => {
    const schedule: Record<string, ScheduleItem> = {
      "2026-09-19": {
        type: "topic",
        chapterId: "motion",
        title: "Distance and Displacement",
        key: "dated_2026-09-19",
        manualOverride: true,
      },
      "2026-09-22": {
        type: "topic",
        chapterId: "motion",
        title: "Speed and Velocity",
        key: "speed_velocity",
      },
    };

    const updated = addHolidayToSchedule(schedule, "2026-09-22", "Test Holiday");

    expect(updated["2026-09-19"]?.title).toBe("Distance and Displacement");
    expect(updated["2026-09-19"]?.manualOverride).toBe(true);
    expect(updated["2026-09-22"]).toEqual({
      type: "holiday",
      label: "Test Holiday",
      manualOverride: true,
    });
  });
});