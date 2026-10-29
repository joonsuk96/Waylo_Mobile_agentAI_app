import assert from "node:assert/strict";
import {
  calendarDays,
  daysInclusive,
  selectRange,
} from "../src/lib/calendar.ts";

const leap = calendarDays(2028, 1).filter(Boolean);
assert.equal(leap.length, 29);
assert.equal(leap.at(-1), "2028-02-29");
assert.equal(calendarDays(2026, 10).length % 7, 0);
assert.equal(daysInclusive("2026-12-30", "2027-01-02"), 4);
assert.equal(daysInclusive("2027-03-13", "2027-03-15"), 3);
assert.equal(daysInclusive("2026-10-28", "2026-10-28"), 1);
assert.deepEqual(selectRange(null, null, "2026-11-05"), {
  start: "2026-11-05",
  end: null,
});
assert.deepEqual(selectRange("2026-11-05", null, "2026-11-05"), {
  start: "2026-11-05",
  end: "2026-11-05",
});
assert.deepEqual(selectRange("2026-11-05", null, "2026-11-03"), {
  start: "2026-11-03",
  end: null,
});
assert.deepEqual(selectRange("2026-11-05", "2026-11-07", "2026-11-10"), {
  start: "2026-11-10",
  end: null,
});
console.log(
  "Calendar checks passed: leap year, full weeks, year/DST boundaries, same-day and range reset.",
);
