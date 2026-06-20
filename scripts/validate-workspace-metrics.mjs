import assert from "node:assert/strict";

const metrics = await import("../lib/workspace-metrics.ts");

const sampleLeads = [
  {
    id: "lead-1",
    created_at: "2026-06-20T10:00:00.000Z",
    meta_created_time: "2026-06-20T10:00:00.000Z",
    status: "new",
  },
  {
    id: "lead-2",
    created_at: "2026-06-18T10:00:00.000Z",
    meta_created_time: "2026-06-18T10:00:00.000Z",
    status: "contacted",
  },
  {
    id: "lead-3",
    created_at: "2026-06-10T10:00:00.000Z",
    meta_created_time: "2026-06-10T10:00:00.000Z",
    status: "qualified",
  },
  {
    id: "lead-4",
    created_at: "2026-05-01T10:00:00.000Z",
    meta_created_time: "2026-05-01T10:00:00.000Z",
    status: "closed",
  },
];

const counts = metrics.countLeadsByStatus(sampleLeads);
assert.deepEqual(counts, {
  total: 4,
  newCount: 1,
  contactedCount: 1,
  qualifiedCount: 1,
  closedCount: 1,
});

assert.equal(
  metrics.countLeadsInPastDays(sampleLeads, 30, new Date("2026-06-20T12:00:00.000Z")),
  3,
);

assert.equal(metrics.getSafePercentage(3, 0), 0);
assert.equal(metrics.getSafePercentage(2, 4), 50);
assert.equal(metrics.getSafeAverage(0, 0), 0);
assert.equal(metrics.getSafeAverage(9, 2), 4.5);

const buckets = metrics.buildLeadBuckets(sampleLeads, 4, new Date("2026-06-20T12:00:00.000Z"));
assert.equal(buckets.length, 4);
assert.equal(
  buckets.reduce((sum, bucket) => sum + bucket.total, 0),
  3,
);

assert.equal(metrics.parseMetricNumber("12.5"), 12.5);
assert.equal(metrics.parseMetricNumber("not-a-number"), null);

console.log("workspace metrics validation passed");
