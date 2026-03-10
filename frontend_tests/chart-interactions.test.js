import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const APP_PATH = path.resolve(process.cwd(), "app.js");

function createHarness() {
  const source = fs.readFileSync(APP_PATH, "utf8");
  const context = {
    console,
    Math,
    Date,
    JSON,
    Intl,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Error,
    parseFloat,
    parseInt,
    isNaN,
    __MYFUND_ENABLE_TEST_HOOKS__: true,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {}
    },
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      body: {
        addEventListener() {}
      }
    },
    window: {
      alert() {},
      confirm() {
        return true;
      },
      open() {},
      setTimeout() {
        return 1;
      },
      clearTimeout() {}
    },
    fetch: async () => {
      throw new Error("fetch disabled in tests");
    },
    FormData: class FormData {
      entries() {
        return [][Symbol.iterator]();
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    },
    Blob: class Blob {},
    URL: {
      createObjectURL() {
        return "blob:test";
      },
      revokeObjectURL() {}
    }
  };

  context.globalThis = context;
  context.setTimeout = context.window.setTimeout;
  context.clearTimeout = context.window.clearTimeout;

  vm.createContext(context);
  vm.runInContext(source, context, { filename: "app.js" });

  const hooks = context.__MYFUND_TEST__;
  assert.ok(hooks, "Test hooks are not available.");
  return hooks;
}

test("sliceLineChartSeriesByRange keeps full series for ALL", () => {
  const hooks = createHarness();
  const view = hooks.sliceLineChartSeriesByRange(
    ["2026-01-01", "2026-02-01", "2026-03-01"],
    [100, 120, 140],
    "all"
  );

  assert.deepEqual(view.labels, ["2026-01-01", "2026-02-01", "2026-03-01"]);
  assert.deepEqual(view.values, [100, 120, 140]);
  assert.equal(view.rangeKey, "all");
});

test("sliceLineChartSeriesByRange cuts dated series to requested range", () => {
  const hooks = createHarness();
  const view = hooks.sliceLineChartSeriesByRange(
    ["2026-01-01", "2026-02-01", "2026-03-01", "2026-03-10"],
    [100, 120, 140, 150],
    "30"
  );

  assert.deepEqual(view.labels, ["2026-03-01", "2026-03-10"]);
  assert.deepEqual(view.values, [140, 150]);
});

test("sliceLineChartSeriesByRange falls back to last points when labels are not dates", () => {
  const hooks = createHarness();
  const labels = Array.from({ length: 120 }, (_, index) => `P${index + 1}`);
  const values = Array.from({ length: 120 }, (_, index) => index + 1);
  const view = hooks.sliceLineChartSeriesByRange(labels, values, "90");

  assert.equal(view.labels.length, 90);
  assert.equal(view.labels[0], "P31");
  assert.equal(view.labels[89], "P120");
});

test("buildCandlestickTooltipContent formats date OHLC and volume", () => {
  const hooks = createHarness();
  const tooltip = hooks.buildCandlestickTooltipContent({
    date: "2026-03-10",
    open: 100.25,
    high: 105.75,
    low: 99.5,
    close: 104.5,
    volume: 12345
  });

  assert.match(tooltip.label, /2026|marca|mar/i);
  assert.match(tooltip.value, /^C /);
  assert.match(tooltip.meta, /O /);
  assert.match(tooltip.meta, /H /);
  assert.match(tooltip.meta, /L /);
  assert.match(tooltip.meta, /V /);
});
