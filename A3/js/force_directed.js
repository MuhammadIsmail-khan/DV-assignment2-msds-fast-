// js/force_directed.js

/**
 * Renders a force‐directed graph into `container`.
 * @param {string} container – selector for the chart panel
 * @param {Array<Object>} data – cleaned JSON rows
 * @param {{src: string, tgt: string}} dims – dims.src is the source field, dims.tgt the target field
 */
function renderForce(container, data, dims) {
  const { src, tgt } = dims;

  // Clear any existing chart
  d3.select(container).selectAll('*').remove();

  // Dimensions
  const width  = d3.select(container).node().clientWidth;
  const height = d3.select(container).node().clientHeight;

  // Build node map
  const nodeMap = new Map();
  let nextId = 0;
  function getNode(name) {
    if (!nodeMap.has(name)) {
      nodeMap.set(name, { id: nextId++, name });
    }
    return nodeMap.get(name);
  }

  // Build links with counts
  const linkCounts = {};
  data.forEach(d => {
    const s = getNode(d[src]);
    const t = getNode(d[tgt]);
    const key = s.id < t.id ? `${s.id}|${t.id}` : `${t.id}|${s.id}`;
    if (!linkCounts[key]) linkCounts[key] = { source: s.id, target: t.id, value: 0 };
    linkCounts[key].value += 1;
  });

  const nodes = Array.from(nodeMap.values());
  const links = Object.values(linkCounts);

  // Color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(nodes.map(n => n.id));

  // Tooltip
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0);

  // SVG + zoom
  const svg = d3.select(container)
    .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(d3.zoom()
        .scaleExtent([0.5, 4])
        .on('zoom', ({ transform }) => g.attr('transform', transform))
      );

  const g = svg.append('g');

  // Draw links
  const link = g.append('g')
    .attr('stroke', '#aaa')
    .selectAll('line')
    .data(links)
    .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

  // Force simulation (defined once)
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(80))
    .force('charge', d3.forceManyBody().strength(-120))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .on('tick', ticked);

  // Drag behavior using the same simulation
  function drag(sim) {
    return d3.drag()
      .on('start', event => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', event => {
        if (!event.active) sim.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  // Draw nodes
  const node = g.append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
      .attr('r', 8)
      .attr('fill', d => color(d.id))
      .call(drag(simulation))
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.name}</strong>`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        // set categorical filter on the `src` dimension to just this node
        globalFilters.categorical[src] = new Set([ d.name ]);
        dispatch.call('filterChanged', null, globalFilters);
      });

  // Optional labels
  const label = g.append('g')
    .selectAll('text')
    .data(nodes)
    .join('text')
      .text(d => d.name)
      .attr('font-size', '0.75rem')
      .attr('dx', 10)
      .attr('dy', 4)
      .attr('fill', '#fff');

  // Simulation tick: update positions
  function ticked() {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    label
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  }
}

// Expose globally so dashboard.js can call it
window.renderForce = renderForce;
