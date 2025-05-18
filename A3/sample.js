 
// // 3) Generate the Filters UI
// function buildFilterUI(data, filterableFields) {
//   // remove any existing
//   d3.select('#filters').remove();

//   // container under selectors
//   const container = d3.select('#selectors')
//     .append('div')
//       .attr('id','filters')
//       .style('margin-top','1.5rem');

//   container.append('h2')
//     .text('Filters')
//     .style('color', 'var(--accent)')
//     .style('margin-bottom', '0.75rem');

//   // -- CATEGORICAL --
//   filterableFields.categorical.forEach(field => {
//     const values = Array.from(new Set(data.map(d => d[field]))).sort();
//     const wrap = container.append('div').attr('class','selector');
//     wrap.append('label').text(field + ' (multi)').style('display','block');
//     const select = wrap.append('select')
//       .attr('multiple', true)
//       .style('width','100%')
//       .style('height','80px');

//     select.selectAll('option')
//       .data(values)
//       .join('option')
//         .attr('value', d => d)
//         .text(d => d)
//         .property('selected', true);

//     // on change: update globalFilters and dispatch
//     select.on('change', function() {
//       const chosen = Array.from(this.selectedOptions).map(o=>o.value);
//       globalFilters.categorical[field] = new Set(chosen);
//       dispatch.call('filterChanged', null, globalFilters);
//     });
//   });

//   // -- NUMERIC --
//   filterableFields.numeric.forEach(field => {
//     const arr = data.map(d => d[field]);
//     const min = d3.min(arr), max = d3.max(arr);
//     // initialize
//     globalFilters.numeric[field] = [min, max];

//     const wrap = container.append('div').attr('class','selector');
//     wrap.append('label').text(field + ` (range ${min}–${max})`).style('display','block');

//     // two number inputs
//     const inputs = wrap.append('div').style('display','flex').style('gap','0.5rem');
//     inputs.append('input')
//       .attr('type','number')
//       .attr('min', min)
//       .attr('max', max)
//       .attr('value', min)
//       .on('input', function() {
//         let lo = +this.value, hi = globalFilters.numeric[field][1];
//         if (lo > hi) lo = hi;
//         globalFilters.numeric[field] = [lo, hi];
//         sliderLow.property('value', lo);
//         dispatch.call('filterChanged', null, globalFilters);
//       });
//     inputs.append('input')
//       .attr('type','number')
//       .attr('min', min)
//       .attr('max', max)
//       .attr('value', max)
//       .on('input', function() {
//         let hi = +this.value, lo = globalFilters.numeric[field][0];
//         if (hi < lo) hi = lo;
//         globalFilters.numeric[field] = [lo, hi];
//         sliderHigh.property('value', hi);
//         dispatch.call('filterChanged', null, globalFilters);
//       });

//     // two range sliders
//     const sliders = wrap.append('div').style('display','flex').style('gap','0.5rem').style('margin-top','0.4rem');
//     const sliderLow = sliders.append('input')
//       .attr('type','range')
//       .attr('min', min)
//       .attr('max', max)
//       .attr('value', min)
//       .on('input', function() {
//         let lo = +this.value, hi = +sliderHigh.property('value');
//         if (lo > hi) lo = hi;
//         numberLo.property('value', lo);
//         globalFilters.numeric[field] = [lo, hi];
//         dispatch.call('filterChanged', null, globalFilters);
//       });
//     const sliderHigh = sliders.append('input')
//       .attr('type','range')
//       .attr('min', min)
//       .attr('max', max)
//       .attr('value', max)
//       .on('input', function() {
//         let hi = +this.value, lo = +sliderLow.property('value');
//         if (hi < lo) hi = lo;
//         numberHi.property('value', hi);
//         globalFilters.numeric[field] = [lo, hi];
//         dispatch.call('filterChanged', null, globalFilters);
//       });

//     // keep references for number↔slider sync
//     const numberLo = inputs.select('input:nth-child(1)');
//     const numberHi = inputs.select('input:nth-child(2)');
//   });

//   // -- DATE --
//   filterableFields.date.forEach(field => {
//     const parse = d3.isoParse;
//     const dates = data.map(d => parse(d[field])).filter(d=>d);
//     const min = d3.min(dates), max = d3.max(dates);
//     // initialize
//     globalFilters.date[field] = [min, max];

//     const wrap = container.append('div').attr('class','selector');
//     wrap.append('label').text(field + ' (date)').style('display','block');
//     const inputs = wrap.append('div').style('display','flex').style('gap','0.5rem');
//     inputs.append('input')
//       .attr('type','date')
//       .attr('value', min.toISOString().slice(0,10))
//       .on('change', function() {
//         const lo = new Date(this.value), hi = globalFilters.date[field][1];
//         if (lo > hi) lo = hi;
//         globalFilters.date[field] = [lo, hi];
//         dispatch.call('filterChanged', null, globalFilters);
//       });
//     inputs.append('input')
//       .attr('type','date')
//       .attr('value', max.toISOString().slice(0,10))
//       .on('change', function() {
//         const hi = new Date(this.value), lo = globalFilters.date[field][0];
//         if (hi < lo) hi = lo;
//         globalFilters.date[field] = [lo, hi];
//         dispatch.call('filterChanged', null, globalFilters);
//       });
//   });
// }





