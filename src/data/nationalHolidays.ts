// Indian national / gazetted school holidays (central government list).
// Mirrors the seeds in the `national_holidays` table; used as a synchronous
// fallback so the calendar can render before the table fetch resolves.
// Festival dates follow the lunar calendar — confirm against the school's
// own list each year.
export const NATIONAL_HOLIDAYS: Record<string, string> = {
  "2025-08-15": "Independence Day",
  "2025-08-19": "Raksha Bandhan",
  "2025-08-26": "Janmashtami",
  "2025-10-02": "Gandhi Jayanti",
  "2025-10-20": "Dussehra",
  "2025-10-21": "Diwali",
  "2025-11-15": "Guru Nanak Jayanti",
  "2025-12-25": "Christmas Day",
  "2026-01-26": "Republic Day",
  "2026-02-15": "Maha Shivaratri",
  "2026-03-04": "Holi",
  "2026-03-20": "Eid-ul-Fitr",
  "2026-04-03": "Good Friday",
  "2026-05-01": "Buddha Purnima",
  "2026-05-27": "Bakrid",
  // Academic year 2026–27
  "2026-06-26": "Muharram",
  "2026-08-15": "Independence Day",
  "2026-08-26": "Milad-un-Nabi",
  "2026-09-04": "Janmashtami",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Dussehra",
  "2026-11-08": "Diwali",
  "2026-11-24": "Guru Nanak Jayanti",
  "2026-12-25": "Christmas Day",
  "2027-01-26": "Republic Day",
  "2027-03-22": "Holi",
  "2027-03-26": "Good Friday",
};
