// js/sunburst.js

/**
 * Renders a zoomable sunburst into `container`.
 * @param {string} container – selector for the chart panel
 * @param {Array<Object>} data – cleaned JSON rows
 * @param {{ hierarchy: string[] }} dims – up to four categorical fields in order
 */
function renderSunburst(container, data, dims) {
  console.log("Rendering sunburst chart ----------------------");
  console.log("Data:", data);
  console.log("Dimensions (hierarchy):", dims.hierarchy);
  const fields = dims.hierarchy;
  console.log("Fields:---------------- ", fields);
  if (!fields || fields.length < 2) {
    console.log("Not enough hierarchy levels to render the chart.");
    return;
  }

  // Clear existing
  d3.select(container).selectAll('*').remove();

  const width  = d3.select(container).node().clientWidth;
  const height = d3.select(container).node().clientHeight;
  const radius = Math.min(width, height) / 2;

  // Build a nested tree {name, children, value}
  const rootData = { name: 'root', children: [] };
  data.forEach(d => {
    let node = rootData;
    fields.forEach((f, i) => {
      const val = d[f] + '';
      let child = node.children.find(c => c.name === val);
      if (!child) {
        child = { name: val, children: [] };
        node.children.push(child);
      }
      node = child;
      if (i === fields.length - 1) {
        node.value = (node.value || 0) + 1;
      }
    });
  });

  // Create hierarchy and partition
  const root = d3.hierarchy(rootData)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  d3.partition()
    .size([2 * Math.PI, radius])(root);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // compute ring thickness
  const levels    = fields.length;
  const ringWidth = radius / levels;

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(  d => d.x1)
    .innerRadius(d => (d.depth - 1) * ringWidth)
    .outerRadius(d => d.depth       * ringWidth);

  // Tooltip
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('opacity', 0);

  const svg = d3.select(container)
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  // Draw slices
  svg.selectAll('path')
    .data(
      root.descendants()
        .filter(d => d.depth >= 1 && d.depth <= levels)
    )
    .join('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', '#fff')
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${d.ancestors().map(a => a.data.name).slice(1).join(' → ')}</strong><br/>
            Count: ${d.value}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mousemove', event => {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => tooltip.style('opacity', 0))
      .on('click', (event, p) => {
        // ——— In-chart filtering: set the global categorical filter ———
        const field = fields[p.depth - 1];
        globalFilters.categorical[field] = new Set([ p.data.name ]);
        dispatch.call('filterChanged', null, globalFilters);

        // ——— Zoom transition ———
        svg.transition().duration(750).tween('scale', () => {
          const xd = d3.interpolate(svg.attr('data-x0')||0, p.x0);
          const xr = d3.interpolate(svg.attr('data-x1')||2*Math.PI, p.x1);
          const yd = d3.interpolate(svg.attr('data-y0')||0, p.y0);
          const yr = d3.interpolate(svg.attr('data-y1')||radius, p.y1);
          return t => {
            const x0 = xd(t), x1 = xr(t), y0 = yd(t), y1 = yr(t);
            arc.startAngle(d => (d.x0 - x0) / (x1 - x0) * 2*Math.PI)
               .endAngle  (d => (d.x1 - x0) / (x1 - x0) * 2*Math.PI)
               .innerRadius(d => Math.max(0, d.y0 - y0))
               .outerRadius(d => Math.max(0, d.y1 - y0));
            svg.selectAll('path').attr('d', arc);
          };
        })
        .on('end', () => {
          svg.attr('data-x0', p.x0)
             .attr('data-x1', p.x1)
             .attr('data-y0', p.y0)
             .attr('data-y1', p.y1);
        });
      });

  // Center circle for reset
  svg.append('circle')
    .attr('r', radius * 0.05)
    .attr('fill', '#333')
    .on('click', () => renderSunburst(container, data, dims));
}

// Expose globally
window.renderSunburst = renderSunburst;
