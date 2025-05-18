// js/radial_bar.js

/** 
 * Renders a radial bar chart into `container`.
 * @param {string} container – selector for the chart panel
 * @param {Array<Object>} data – cleaned JSON rows
 * @param {{cat: string, val: string}} dims – dims.cat is the category field, dims.val the numeric field
 */
function renderRadial(container, data, dims) {
  const { cat, val } = dims;

  // Remove any existing chart
  d3.select(container).selectAll('*').remove();

  // Size & margins
  const width  = d3.select(container).node().clientWidth;
  const height = d3.select(container).node().clientHeight;
  const margin = 40;
  const radius = Math.min(width, height) / 2 - margin;

  // SVG & group
  const svg = d3.select(container)
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  // Aggregate data: sum values per category
  const rolled = Array.from(
    d3.rollup(
      data,
      v => d3.sum(v, d => d[val]),
      d => d[cat]
    ),
    ([key, sum]) => ({ key, sum })
  );

  // Sort categories descending
  rolled.sort((a, b) => b.sum - a.sum);

  // Scales
  const angleScale = d3.scaleBand()
    .domain(rolled.map(d => d.key))
    .range([0, 2 * Math.PI])
    .align(0);

  const radiusScale = d3.scaleLinear()
    .domain([0, d3.max(rolled, d => d.sum)])
    .range([0, radius]);

  const color = d3.scaleOrdinal()
    .domain(rolled.map(d => d.key))
    .range(d3.schemeTableau10);

  // Tooltip
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute');

  // Draw bars
  svg.selectAll('path')
    .data(rolled)
    .join('path')
      .attr('fill', d => color(d.key))
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(d => radiusScale(d.sum))
        .startAngle(d => angleScale(d.key))
        .endAngle(d => angleScale(d.key) + angleScale.bandwidth())
        .padAngle(0.01)
        .padRadius(0)
      )
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.key}</strong><br/>${val}: ${d.sum.toLocaleString()}`)
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
      // ← ADD THIS CLICK HANDLER:
      .on('click', (event, d) => {
        // look up which field we're using
        const field = lastDimsByChart.radial.cat;     // e.g. "Region"
        // set the filter to just this one category
        globalFilters.categorical[field] = new Set([ d.key ]);
        // fire your filterChanged pipeline
        dispatch.call('filterChanged', null, globalFilters);
      })
    .transition()
      .duration(800)
      .attrTween('d', function(d) {
        const i = d3.interpolateNumber(0, d.sum);
        return t => d3.arc()({
          innerRadius: 0,
          outerRadius: radiusScale(i(t)),
          startAngle: angleScale(d.key),
          endAngle: angleScale(d.key) + angleScale.bandwidth()
        });
      });

  // Category labels
  svg.selectAll('g.label')
    .data(rolled)
    .join('g')
      .attr('class', 'label')
      .attr('text-anchor', d => {
        const mid = angleScale(d.key) + angleScale.bandwidth() / 2;
        return (mid < Math.PI ? 'start' : 'end');
      })
      .attr('transform', d => {
        const mid = angleScale(d.key) + angleScale.bandwidth() / 2;
        const x = Math.cos(mid - Math.PI/2) * (radius + 10);
        const y = Math.sin(mid - Math.PI/2) * (radius + 10);
        return `translate(${x},${y})`;
      })
    .append('text')
      .text(d => d.key)
      .style('font-size', '0.75rem')
      .attr('alignment-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('transform', d => {
        const mid = angleScale(d.key) + angleScale.bandwidth() / 2;
        return (mid < Math.PI ? '' : 'rotate(180)');
      });
}

// Expose globally so dashboard.js can find it
window.renderRadial = renderRadial;
