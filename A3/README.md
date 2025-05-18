# Automated D3 Dashboard

An interactive, browser-based data visualization dashboard built with D3.js. Users can upload any flat JSON dataset and immediately explore it through four linked visualizations, Radial Bar, Chord Diagram, Force-Directed Graph, and Sunburst Chart. with intelligent, synchronized filtering (both via widgets and in-chart brushing/selection).

---


## Project Overview

This project is a fully client-side, data-agnostic dashboard that:

- Dynamically reads flat JSON arrays.
- Automatically detects which fields are categorical, numeric, or date.
- Builds both chart selectors and a filter panel (multi-selects, sliders, date picks).
- Renders four distinct D3 visualizations.
- Enables linked brushing & filtering across all charts (widget + in-chart).
- Uses a responsive layout that wraps panels into a grid and adapts to screen size.

---

## 1. Features

- **One-click data upload**: Simply drag‐and‐drop or select a `.json` file.  
- **Field-type detection**: Classifies each column into categorical, numeric, or date.  
- **Smart selectors**: Chart-specific dropdowns (or checkboxes for multi-hierarchy).  
- **Universal filter panel**:  
  - Multi-select lists for categorical fields  
  - Dual-handle sliders & number inputs for numeric ranges  
  - Date range pickers for date fields  
- **Linked filtering**: Any filter change instantly re-renders all four charts.  
- **In-chart selection**:  
  - Click radial bars to filter that category  
  - Click chord arcs to isolate a relationship  
  - Drag to select force graph nodes  
  - Click sunburst segments to drill into that branch  
- **Responsive design**: Grid layout with fixed-height panels; stacks vertically on narrow screens.

---

## 2. Data Pre-processing & Field Classification

Before any visualization, the raw JSON is:

1. **Parsed & validated**  
   - Must be a non-empty array of flat objects.  
   - Rows with `null` or `""` for any field are dropped.  
2. **Type coercion**  
   - Strings that parse as numbers converted to Number.  
3. **Field-type detection**  
   - **Numeric**: all values numeric & > 5 unique entries  
   - **Date**: all values parseable by `Date.parse` & > 5 unique entries  
   - **Categorical**: ≤ 50 unique values or ≤ 50 % of rows  
   - **Other**: ignored for filtering/selectors  

---

## 3. Dashboard & Navigation

Our dashboard comprises **four linked charts** in a responsive grid. Each panel has:

- **Header** with chart title  
- **Chart container** that auto-sizes to fill the panel  

### 3.1 Radial Bar Chart  
- **Dimensions**: 1 categorical (e.g. “Region”), 1 numeric (e.g. “Revenue”)  
- **View**: Bars radiating from center, length ∝ sum of numeric field per category  
- **Filters**: Click a bar to isolate that category; synchronize with all other charts  

### 3.2 Chord Diagram  
- **Dimensions**: 2 categoricals (e.g. “Source → Target”)  
- **View**: Circular arcs showing co-occurrence between categories  
- **Filters**: Hover or click an arc to filter on that pair  

### 3.3 Force-Directed Graph  
- **Dimensions**: 2 categoricals mapping to nodes & links  
- **View**: Interactive network with draggable nodes; link thickness ∝ count  
- **Filters**: Select nodes to filter data globally  

### 3.4 Sunburst Chart  
- **Dimensions**: 2–4 categoricals (hierarchical)  
- **View**: Radial partition; ring depth = hierarchy level  
- **Filters**: Click a segment to drill in or filter on that branch  

All four are **linked**: any filter widget change or in-chart selection triggers a global `filterChanged` event, re-filtering the dataset and re-rendering each chart with its last chosen dimensions.

---

## 4. Filter Panel & Widgets

Below the chart selectors, an intelligent **Filters** panel is auto-generated:

- **Categorical**: multi-select `<select multiple>` listing every unique value  
- **Numeric**: dual-handle sliders + synced number inputs (min/max)  
- **Date**: two `<input type="date">` for start/end  

Changing any widget updates a central `globalFilters` store and dispatches a `filterChanged` event.

---

> **Muhammad Ismail (24i-8004) & Fatima (24i-8075)**