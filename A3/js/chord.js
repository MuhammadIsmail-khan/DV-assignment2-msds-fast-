// js/chord.js

/**
 * Renders a chord diagram into `container`.
 * @param {string} container – selector for the chart panel
 * @param {Array<Object>} data – cleaned JSON rows
 * @param {{src: string, tgt: string}} dims – dims.src is the source field, dims.tgt the target field
 */
function renderChord(container, data, dims) {
  const { src, tgt } = dims;

  // Clear any existing chart
  d3.select(container).selectAll('*').remove();

  // Dimensions
  const width  = d3.select(container).node().clientWidth;
  const height = d3.select(container).node().clientHeight;
  const outerRadius = Math.min(width, height) * 0.5 - 40;
  const innerRadius = outerRadius - 20;

  // Prepare SVG
  const svg = d3.select(container)
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

  // Aggregate unique categories
  const sources = Array.from(new Set(data.map(d => d[src])));
  const targets = Array.from(new Set(data.map(d => d[tgt])));
  const labels  = Array.from(new Set(sources.concat(targets)));

  // Build an index map
  const index = new Map(labels.map((d,i) => [d, i]));

  // Initialize zero matrix
  const matrix = Array.from({ length: labels.length }, () => 
    new Array(labels.length).fill(0)
  );

  // Populate matrix counts
  data.forEach(d => {
    const i = index.get(d[src]),
        j = index.get(d[tgt]);
    matrix[i][j] += 1;
    matrix[j][i] += 1; // symmetric if desired
  });

  // Chord layout
  const chord = d3.chord()
    .padAngle(0.05)
    .sortSubgroups(d3.descending)
    (matrix);

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(labels)
    .range(d3.schemeSet3);

  // Tooltip
  const tooltip = d3.select('body')
    .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute');

  // Groups (outer arcs)
  const group = svg.append('g')
    .selectAll('g')
    .data(chord.groups)
    .join('g');

  group.append('path')
    .attr('fill', d => color(labels[d.index]))
    .attr('stroke', d => d3.rgb(color(labels[d.index])).darker())
    .attr('d', d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
    );

  group.append('text')
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr('dy', '0.35em')
    .attr('transform', d => `
      rotate(${(d.angle * 180 / Math.PI - 90)})
      translate(${outerRadius + 10})
      ${d.angle > Math.PI ? 'rotate(180)' : ''}
    `)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .text(d => labels[d.index])
    .style('font-size', '0.75rem')
    .attr('fill', '#fff');

  // Ribbons (the chords)
  svg.append('g')
    .attr('fill-opacity', 0.75)
    .selectAll('path')
    .data(chord)
    .join('path')
      .attr('d', d3.ribbon()
        .radius(innerRadius)
      )
      .attr('fill', d => color(labels[d.source.index]))
      .attr('stroke', d => d3.rgb(color(labels[d.source.index])).darker())
      .on('mouseover', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`
            <strong>${labels[d.source.index]} ↔ ${labels[d.target.index]}</strong><br/>
            Value: ${matrix[d.source.index][d.target.index]}
          `)
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
        // apply a categorical filter on the `src` field
        globalFilters.categorical[src] = new Set([ labels[d.index] ]);
        dispatch.call('filterChanged', null, globalFilters);
      });
}

// Expose globally so dashboard.js can call it
window.renderChord = renderChord;
