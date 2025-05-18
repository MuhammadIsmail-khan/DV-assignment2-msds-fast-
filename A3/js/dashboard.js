// js/dashboard.js

/**
 * Inspect each column and tag it "categorical", "numeric", "date" or "other"
 * based on value variety & parse-ability.
 */

// ——— NEW: module‐wide storage for the raw dataset ———
let rawData = [];
let lastChart, lastDims;
// up near the top, after you declare lastChart/lastDims:
const lastDimsByChart = {
  radial:    null,
  chord:     null,
  force:     null,
  sunburst:  null
};

// whenever you dispatch dimensionChanged, also save into lastDimsByChart:
function saveLast(chart, dims) {
  lastDimsByChart[chart] = dims;
}



function detectFieldTypes(data) {
  const sample = data[0];
  const cols = Object.keys(sample);
  const types = {};

  cols.forEach((c) => {
    const vals = data.map((d) => d[c]).filter((v) => v != null);
    const uniq = Array.from(new Set(vals));

    const allNum = uniq.every((v) => !isNaN(v)) && uniq.length > 5;
    const allDate = uniq.every((v) => !isNaN(Date.parse(v))) && uniq.length > 5;
    const cat = uniq.length <= Math.min(data.length * 0.5, 50);

    types[c] = allNum
      ? "numeric"
      : allDate
      ? "date"
      : cat
      ? "categorical"
      : "other";
  });

  return types;
}

// ---- globalFilters store ----
const globalFilters = {
  categorical: {},
  numeric: {},
  date: {},
};

// 1) Create dispatch for chart updates
const dispatch = d3.dispatch("dimensionChanged", "filterChanged");

// 2) File input listener
d3.select("#file-input").on("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    let raw;
    try {
      raw = JSON.parse(reader.result);
    } catch {
      return alert("❌ Invalid JSON.");
    }

    const data = preprocess(raw);
    console.log("📊 Data:------", data);
    if (!data) return; // errors shown inside preprocess

    // ——— Store it in our module‐wide variable ———
    rawData = data;
    //

    // --- NEW: detect and log field types ---
    const types = detectFieldTypes(data);
    console.group("🔍 Detected Fields and Types");
    Object.entries(types).forEach(([field, type]) => {
      console.log(`${field}: ${type}`);
    });
    console.groupEnd();

    // 2) build our filterable fields registry
    const categoricalFields = [];
    const numericFields = [];
    const dateFields = [];

    Object.entries(types).forEach(([field, type]) => {
      if (type === "categorical") categoricalFields.push(field);
      else if (type === "numeric") numericFields.push(field);
      else if (type === "date") dateFields.push(field);
    });

    const filterableFields = {
      categorical: categoricalFields,
      numeric: numericFields,
      date: dateFields,
    };

    console.log("📋 Filterable Fields:", filterableFields);

    buildSelectors(data);
    buildFilterUI(data, filterableFields);

    setupRenderers();
    initialRender(data);
  };
  reader.readAsText(file);
});

// 3) Generate the Filters UI
function buildFilterUI(data, filterableFields) {
  // clear old filters
  d3.select("#filters").remove();

  // container under selectors
  const container = d3
    .select("#selectors")
    .append("div")
    .attr("id", "filters")
    .style("margin-top", "1.5rem");

  container
    .append("h2")
    .text("Filters")
    .style("color", "var(--accent)")
    .style("margin-bottom", "0.75rem");

  // -- CATEGORICAL --
  filterableFields.categorical.forEach((field) => {
    const values = Array.from(new Set(data.map((d) => d[field]))).sort();

    // initialize full set
    globalFilters.categorical[field] = new Set(values);

    const wrap = container.append("div").attr("class", "selector");
    wrap
      .append("label")
      .text(field + " (multi)")
      .style("display", "block");
    const select = wrap
      .append("select")
      .attr("multiple", true)
      .style("width", "100%")
      .style("height", "80px");

    select
      .selectAll("option")
      .data(values)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d)
      .property("selected", true);

    // on change: update globalFilters and dispatch
    select.on("change", function () {
      const chosen = Array.from(this.selectedOptions).map((o) => o.value);
      globalFilters.categorical[field] = new Set(chosen);
      dispatch.call("filterChanged", null, globalFilters);
    });
  });

  // -- NUMERIC --
  filterableFields.numeric.forEach((field) => {
    const arr = data.map((d) => d[field]);
    const min = d3.min(arr),
      max = d3.max(arr);

    // initialize
    globalFilters.numeric[field] = [min, max];

    const wrap = container.append("div").attr("class", "selector");
    wrap
      .append("label")
      .text(`${field} (${min}–${max})`)
      .style("display", "block");

    // number inputs + sliders
    const inputs = wrap
      .append("div")
      .style("display", "flex")
      .style("gap", "0.5rem");
    const numberLo = inputs
      .append("input")
      .attr("type", "number")
      .attr("min", min)
      .attr("max", max)
      .attr("value", min);
    const numberHi = inputs
      .append("input")
      .attr("type", "number")
      .attr("min", min)
      .attr("max", max)
      .attr("value", max);

    const sliders = wrap
      .append("div")
      .style("display", "flex")
      .style("gap", "0.5rem")
      .style("margin-top", "0.4rem");
    const sliderLo = sliders
      .append("input")
      .attr("type", "range")
      .attr("min", min)
      .attr("max", max)
      .attr("value", min);
    const sliderHi = sliders
      .append("input")
      .attr("type", "range")
      .attr("min", min)
      .attr("max", max)
      .attr("value", max);

    // shared update function
    function updateNumeric() {
      let lo = +numberLo.property("value"),
        hi = +numberHi.property("value");
      if (lo > hi) lo = hi;
      if (hi < lo) hi = lo;
      globalFilters.numeric[field] = [lo, hi];
      numberLo.property("value", lo);
      numberHi.property("value", hi);
      sliderLo.property("value", lo);
      sliderHi.property("value", hi);
      dispatch.call("filterChanged", null, globalFilters);
    }

    numberLo.on("input", updateNumeric);
    numberHi.on("input", updateNumeric);
    sliderLo.on("input", () => {
      numberLo.property("value", sliderLo.property("value"));
      updateNumeric();
    });
    sliderHi.on("input", () => {
      numberHi.property("value", sliderHi.property("value"));
      updateNumeric();
    });
  });

  // -- DATE --
  filterableFields.date.forEach((field) => {
    const parse = d3.isoParse;
    const dates = data.map((d) => parse(d[field])).filter((d) => d);
    const min = d3.min(dates),
      max = d3.max(dates);

    // initialize
    globalFilters.date[field] = [min, max];

    const wrap = container.append("div").attr("class", "selector");
    wrap
      .append("label")
      .text(field + " (date)")
      .style("display", "block");

    const inputs = wrap
      .append("div")
      .style("display", "flex")
      .style("gap", "0.5rem");
    const inputLo = inputs
      .append("input")
      .attr("type", "date")
      .attr("value", min.toISOString().slice(0, 10));
    const inputHi = inputs
      .append("input")
      .attr("type", "date")
      .attr("value", max.toISOString().slice(0, 10));

    function updateDate() {
      let lo = new Date(inputLo.property("value")),
        hi = new Date(inputHi.property("value"));
      if (lo > hi) lo = hi;
      if (hi < lo) hi = lo;
      globalFilters.date[field] = [lo, hi];
      inputLo.property("value", lo.toISOString().slice(0, 10));
      inputHi.property("value", hi.toISOString().slice(0, 10));
      dispatch.call("filterChanged", null, globalFilters);
    }

    inputLo.on("change", updateDate);
    inputHi.on("change", updateDate);
  });
}
// ---- END OF FILTERS UI ----

// 4) React to filterChanged
// Now update your filter handler to redraw ALL:
dispatch.on("filterChanged", (currentFilters) => {
  // compute filtered dataset
  const filtered = rawData.filter(d => {
    // categorical…
    for (let f in currentFilters.categorical) {
      if (!currentFilters.categorical[f].has(d[f])) return false;
    }
    // numeric…
    for (let f in currentFilters.numeric) {
      const [lo,hi] = currentFilters.numeric[f];
      if (d[f] < lo || d[f] > hi) return false;
    }
    // date…
    for (let f in currentFilters.date) {
      const [lo,hi] = currentFilters.date[f];
      const v = new Date(d[f]);
      if (v < lo || v > hi) return false;
    }
    return true;
  });

  // now re-dispatch dimensionChanged for each chart using its saved dims
  Object.entries(lastDimsByChart).forEach(([chart, dims]) => {
    if (!dims) return;  // not yet initialized
    dispatch.call("dimensionChanged", null, {
      chart,
      dims,
      data: filtered
    });
  });
});

/** Preprocess:
 * - Must be non-empty array of flat objects
 * - Coerce numeric strings → numbers
 * - Filter out rows with missing values
 */
function preprocess(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    alert("❌ JSON must be a non-empty array.");
    return null;
  }
  const sample = raw[0];
  if (typeof sample !== "object" || Array.isArray(sample)) {
    alert("❌ JSON array must contain flat objects.");
    return null;
  }

  const cols = Object.keys(sample);
  const isNumeric = {};
  cols.forEach((c) => {
    isNumeric[c] = raw.every((d) => d[c] != null && !isNaN(d[c]));
  });

  const clean = raw
    .map((d) => {
      const obj = {};
      for (let c of cols) {
        let v = d[c];
        if (v == null || v === "") return null;
        if (isNumeric[c]) v = +v;
        obj[c] = v;
      }
      return obj;
    })
    .filter((d) => d !== null);

  if (clean.length === 0) {
    alert("❌ All rows had missing values; no data remains.");
    return null;
  }
  return clean;
}

/** Dynamically build the four selectors */
function buildSelectors(data) {
  const types = detectFieldTypes(data);
  const cols = Object.keys(data[0]);
  const byType = (t) => cols.filter((c) => types[c] === t);

  const radCat = byType("categorical"),
    radVal = byType("numeric");

  const container = d3.select("#selectors").html("");

  // RADIAL BAR: 1 category + 1 value
  const rWrap = container.append("div").attr("class", "selector");
  rWrap.append("label").text("Radial: Category");
  rWrap
    .append("select")
    .attr("id", "radial-cat")
    .selectAll("option")
    .data(["--", "", ...radCat])
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d || "-- select --");

  rWrap.append("label").text("Radial: Value");
  rWrap
    .append("select")
    .attr("id", "radial-val")
    .selectAll("option")
    .data(["--", "", ...radVal])
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d || "-- select --");

  // CHORD DIAGRAM: 2 categorical
  const chordWrap = container.append("div").attr("class", "selector");
  ["Source", "Target"].forEach((lab, i) => {
    chordWrap.append("label").text(`Chord: ${lab}`);
    chordWrap
      .append("select")
      .attr("id", `chord-${i ? "tgt" : "src"}`)
      .selectAll("option")
      .data(["--", "", ...radCat])
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d || "-- select --");
  });

  // FORCE GRAPH: 2 categorical
  const forceWrap = container.append("div").attr("class", "selector");
  ["Source", "Target"].forEach((lab, i) => {
    forceWrap.append("label").text(`Force: ${lab}`);
    forceWrap
      .append("select")
      .attr("id", `force-${i ? "tgt" : "src"}`)
      .selectAll("option")
      .data(["--", "", ...radCat])
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d || "-- select --");
  });

  // SUNBURST: replace multi-select with checkboxes
  const sbWrap = container.append("div").attr("class", "selector");
  sbWrap.append("label").text("Sunburst: Hierarchy (2–4 levels)");
  const cbContainer = sbWrap
    .append("div")
    .style("border", "1px solid #444")
    .style("padding", "0.5em")
    .style("max-height", "120px")
    .style("overflow-y", "auto");

  radCat.forEach((field) => {
    const id = `sunburst-${field}`;
    const row = cbContainer.append("div");
    row
      .append("input")
      .attr("type", "checkbox")
      .attr("id", id)
      .attr("value", field);
    row.append("label").attr("for", id).text(field).style("margin-left", "4px");
  });

  // Dispatch on change for each chart
  d3.selectAll("#radial-cat, #radial-val").on("change", () => {
    const cat = d3.select("#radial-cat").property("value"),
      val = d3.select("#radial-val").property("value");

    if (!cat || !val) return;

    // remember for filtering
    lastChart = "radial";
    lastDims = { cat, val };
    saveLast("radial", { cat, val });

    // dispatch exactly as before
    dispatch.call("dimensionChanged", null, {
      chart: lastChart,
      dims: lastDims,
      data: rawData, // always render from the original data
    });
  });

  d3.selectAll("#chord-src, #chord-tgt").on("change", () => {
    const src = d3.select("#chord-src").property("value"),
      tgt = d3.select("#chord-tgt").property("value");
    if (!src || !tgt) return;
    // remember for filtering
    lastChart = "chord";
    lastDims = { src, tgt };
    saveLast("chord", { src, tgt });

    // dispatch exactly as before
    dispatch.call("dimensionChanged", null, {
      chart: "chord",
      dims: { src, tgt },
      data,
    });
  });

  d3.selectAll("#force-src, #force-tgt").on("change", () => {
    const src = d3.select("#force-src").property("value"),
      tgt = d3.select("#force-tgt").property("value");
    if (!src || !tgt) return;
    // remember for filtering
    lastChart = "force";
    lastDims = { src, tgt };
    saveLast("force", { src, tgt });

    dispatch.call("dimensionChanged", null, {
      chart: "force",
      dims: { src, tgt },
      data,
    });
  });

  // Checkbox listener for Sunburst
  cbContainer.selectAll("input[type=checkbox]").on("change", () => {
    const hierarchy = cbContainer
      .selectAll("input:checked")
      .nodes()
      .map((n) => n.value)
      .slice(0, 4);
    if (hierarchy.length >= 2) {
      // remember for later filtering
      lastChart = "sunburst";
      lastDims = { hierarchy };
      saveLast("sunburst", { hierarchy });

      // always render from the original rawData
      dispatch.call("dimensionChanged", null, {
        chart: "sunburst",
        dims: lastDims,
        data: rawData,
      });
    }
  });
}

/** Auto-select defaults & render all charts once */
function initialRender(data) {
  function selectAndDispatch(selector, index) {
    const opts = d3.select(selector).selectAll("option").nodes();
    if (opts[index]) {
      opts.forEach((o) => (o.selected = false));
      opts[index].selected = true;
      d3.select(selector).dispatch("change");
    }
  }

  selectAndDispatch("#radial-cat", 1);
  selectAndDispatch("#radial-val", 1);
  selectAndDispatch("#chord-src", 1);
  selectAndDispatch("#chord-tgt", 2);
  selectAndDispatch("#force-src", 1);
  selectAndDispatch("#force-tgt", 2);

  // Clear all sunburst checkboxes first
  d3.selectAll("#selectors input[type=checkbox]").property("checked", false);

  // Auto-check first two
  const firstTwo = d3
    .selectAll("#selectors input[type=checkbox]")
    .nodes()
    .slice(0, 2);
  firstTwo.forEach((cb) => (cb.checked = true));

  // Fire change
  firstTwo.length >= 2 && d3.select(firstTwo[1]).dispatch("change");
}

/** Hook each chart into the dispatch bus */
function setupRenderers() {
  dispatch.on("dimensionChanged", ({ chart, dims, data }) => {
    switch (chart) {
      case "radial":
        try {
          renderRadial("#radial-chart .chart-container", data, dims);
        } catch (e) {
          console.error(e);
        }
        break;
      case "chord":
        try {
          renderChord("#chord-chart .chart-container", data, dims);
        } catch (e) {
          console.error(e);
        }
        break;
      case "force":
        try {
          renderForce("#force-chart .chart-container", data, dims);
        } catch (e) {
          console.error(e);
        }
        break;
      case "sunburst":
        try {
          renderSunburst("#sunburst-chart .chart-container", data, dims);
        } catch (e) {
          console.error(e);
        }
        break;
    }
  });
}
