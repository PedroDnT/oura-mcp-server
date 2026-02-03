import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeDiscreteSeries,
  expandNumericSeries,
  tokenizeSeries,
  SLEEP_STAGE_LABELS,
} from "../core/seriesDecode.js";

test("seriesDecode: tokenize supports comma and raw", () => {
  assert.deepEqual(tokenizeSeries("1,2,3"), ["1", "2", "3"]);
  assert.deepEqual(tokenizeSeries("012"), ["0", "1", "2"]);
});

test("seriesDecode: decodeDiscreteSeries timestamps and labels", () => {
  const decoded = decodeDiscreteSeries(
    "123",
    "2024-01-01T00:00:00Z",
    300,
    SLEEP_STAGE_LABELS
  );
  assert.ok(decoded);
  assert.equal(decoded?.points.length, 3);
  assert.equal(decoded?.points[0].label, "deep");
  assert.equal(decoded?.points[1].timestamp, "2024-01-01T00:05:00.000Z");
});

test("seriesDecode: unknown codes get fallback labels", () => {
  const decoded = decodeDiscreteSeries(
    "9",
    "2024-01-01T00:00:00Z",
    300,
    {}
  );
  assert.ok(decoded);
  assert.equal(decoded?.points[0].label, "unknown(9)");
});

test("seriesDecode: expandNumericSeries timestamps", () => {
  const series = expandNumericSeries([10, 11], "2024-01-01T00:00:00Z", 60);
  assert.ok(series);
  assert.equal(series?.points.length, 2);
  assert.equal(series?.points[1].timestamp, "2024-01-01T00:01:00.000Z");
});
