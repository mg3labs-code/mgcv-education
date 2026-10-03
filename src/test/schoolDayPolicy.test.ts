import { describe, expect, it, vi } from "vitest";
import { localTodayKey } from "@/components/teacher/TeachingCalendar";

const nextSchoolDay = (
  from: string,
  saturdayIsSchoolDay: boolean,
  holidays: string[] = [],
) => {
  const date = new Date(`${from}T12:00:00Z`);
  const blocked = new Set(holidays);
  do {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    const key = date.toISOString().slice(0, 10);
    if (day !== 0 && (saturdayIsSchoolDay || day !== 6) && !blocked.has(key)) return key;
  } while (true);
};

describe("school date policy evidence", () => {
  it("uses the teacher's local date across the IST midnight boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T18:31:00Z"));
    expect(localTodayKey()).toBe("2026-10-03");
    vi.useRealTimers();
  });

  it("returns Saturday when Saturdays are school days", () => {
    expect(nextSchoolDay("2026-10-02", true)).toBe("2026-10-03");
  });

  it("skips Saturday and Sunday when Saturdays are not school days", () => {
    expect(nextSchoolDay("2026-10-02", false)).toBe("2026-10-05");
  });

  it("skips a Saturday that the school marks as a holiday", () => {
    expect(nextSchoolDay("2026-10-02", true, ["2026-10-03"])).toBe("2026-10-05");
  });
});