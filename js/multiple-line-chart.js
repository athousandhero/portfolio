/*
*    sart data - fresh vs. frozen lbr by age
*/

var margin = {top: 10, right: 20, bottom: 70, left: 70}
var width = 540 - margin.left - margin.right;
    height = 360 - margin.top - margin.bottom; 

var cleanData;
var color;
var keys;
var x;
var y;

var colorsArr = ['#e64a19', '#009688'];
var labelsArr = ['fresh_lbr', 'frozen_lbr'];

var shapesGroup;

var chartOptions = {
    option1: {}
}

var parseDate = d3.timeParse('%Y');
var formatYear = d3.timeFormat('%Y'); // takes date, returns string

// append svg object to page
var svg = d3.select('#my_dataviz')
    .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('class', 'svg-subgroup-g');

var legend = g.append('g')
    .attr('transform', 'translate(' + (width - 10) + ',' + -5 + ')')
    .attr('class', 'legend');

// event listeners
$('#age-select').on('change', update)

// tooltip
var tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {   
        var age = formatAgeGroup(d.age);
        var dataName = d.col_name === 'fresh_lbr' ? 'Fresh' : 'Frozen';
        var dataValue = d.col_name === 'fresh_lbr' ? 'avg_fresh_tfr' : 'avg_fresh_tfr';

        var text  = '<strong class=\'dataName\'>Year:</strong><span class=\'dataValue\'> ' + formatYear(d.year) + '</span><br/>';
            text += '<strong class=\'dataName\'>Age Group:</strong><span class=\'dataValue\'> ' + age + ' years</span><br/>';
            text += '<strong class=\'dataName\'>Live Birth Rate:</strong><span class=\'dataValue\'> ' + d[d.col_name] + '</span><br/>';
            text += '<strong class=\'dataName\'>Avg Embryos Transferred:</strong><span class=\'dataValue\'> ' + d[dataValue] + '</span><br/>';
        return text; 
    });

svg.call(tip);

// legend
colorsArr.forEach(function(color, i) {
    var legendRow = legend.append('g')
        .attr('transform', 'translate(-110, ' + (i * 20) + ')');
        
    legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', color);
        
        legendRow.append('text')
            .attr('transform', 'translate(18, 10)')
            .style('text-transform', 'capitalize')
            .text({'fresh_lbr': 'Fresh Embryos', 'frozen_lbr': 'Frozen Embryos'}[labelsArr[i]]);
})

// read data
d3.csv('data/sart_2003-2013.csv', function(data) {
    // pre-process data
    data = data.map(function(d) {
        return {
            year: parseDate(d.Year),
            age: d.Age,
            fresh_lbr: +d.Fresh_Live_Birth,
            frozen_lbr: +d.Frozen_Live_Birth,
            avg_fresh_tfr: +d.Avg_Fresh_Transferred,
            avg_frozen_tfr: +d.Avg_Frozen_Transferred
        }
    })

    // group data by age group
    cleanData = d3.nest()
        .key(function(d) { return d.age; })
        .entries(data);
    
    // get array of age groups            
    keys = cleanData.map(function(d) { return d.key; })

    // set data structure for option1 - per age, fresh_lbr vs. frozen_lbr:
    cleanData.forEach(function(k) {
        chartOptions.option1[k.key] = {
            'fresh_lbr': k.values.map(function(v) {
                var t = JSON.parse(JSON.stringify(v))
                t.year = new Date(v.year.getTime());
                t.col_name = 'fresh_lbr';
                return t;
            }),
            'frozen_lbr': k.values.map(function(v) {
                var t = JSON.parse(JSON.stringify(v));
                t.year = new Date(v.year.getTime());
                t.col_name = 'frozen_lbr';
                return t;
            })
        }
    })

    setScales(data);
    update();
}) // end d3.csv()

function setScales(data) {
    // x scale
    x = d3.scaleTime().domain(d3.extent(data, function(d) { return d.year; })).range([0, width]);

    g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .attr('class', 'axis x')
        .call(d3.axisBottom(x));       

    // y scale
    y = d3.scaleLinear().domain([0, 0.6]).range([height, 0]);

    g.append('g')
        .attr('class', 'axis y')
        .call(d3.axisLeft(y));
       
    // color scale
    color = d3.scaleOrdinal()
        .domain(labelsArr)
        .range(colorsArr);
        //.range(['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999']);
   
    // Chart Labels
    //var ageLabel = g.append('text').attr('y', height-10).attr('x', width-40).attr('class', 'age-label').attr('text-anchor', 'middle').text('< 35 years');
    var xAxisLabel = g.append('text').attr('y', height + 45).attr('x', width / 2).attr('class', 'chart-label').attr('text-anchor', 'middle').text('Year');
    var yAxisLabel = g.append('text').attr('transform', 'rotate(-90)').attr('y', -45).attr('x', -130).attr('class', 'chart-label').attr('text-anchor', 'middle').text('Live Birth Rate');
  
    // append group to append all shapes to
    shapesGroup = g.append('g')
        .attr('class', 'shapes-group');
    
} // end setScales

function update() {
    // get current age group and set data accordingly
    var currKey = keys[keys.indexOf($('#age-select').val())];
    var data = [chartOptions.option1[currKey]['fresh_lbr'], chartOptions.option1[currKey]['frozen_lbr']];

    //~~~~~ 1. add/update/remove path (lines) ~~~~~ 

    // JOIN new data with old path elements
    var paths = shapesGroup.selectAll('path')
        .data(data);
        //.data(data, function(d) { return d.col_name; });

    // EXIT old elements not present in new data
    paths.exit().remove();

    // ENTER new elements present in new data
    paths.enter()
        .append('path')
            .attr('fill', 'none')
            .attr('class', 'line')
            .attr('stroke-width', 0)
        .merge(paths)  // UPDATE old elements present in new data AND new elements present in data
        .transition(d3.transition().duration(500))
            .attr('stroke', function(d, i) { return color(i === 0 ? 'fresh_lbr' : 'frozen_lbr'); })
            .attr('stroke-width', 1.5)
            .attr('d', function(d, i) {
                return d3.line()
                    .x(function(p) { return x(p.year); })
                    .y(function(p) { return y(p[p.col_name]); })
                    (d);
            });

    //~~~~~ 2. add/update/remove g group for circles ~~~~~ 

    // JOIN new data with old g elements
    var circleGroupsUpdate = shapesGroup.selectAll('g')
        .data(data);

    // EXIT old g elements not present in new data
    circleGroupsUpdate.exit().remove();

    // ENTER new g elements present in new data
    var circleGroups = circleGroupsUpdate.enter()
        .append('g')
        .merge(circleGroupsUpdate)
           .attr('class', 'circle-group');


    //~~~~~ 3. add/update/remove circles ~~~~~  

    // JOIN new data with old circle elements
    var circle = circleGroups.selectAll('.circle')
        .data(function(d, i) { return d; });
        
    // EXIT old circle elements not present in new data
    circle.exit().remove();

    // ENTER new circle elements present in new data
    circle.enter()
        .append('circle')
            .attr('class', 'circle')
            .attr('cx', function(c) { return x(c.year); })
            .attr('cy', function(c) { return y(c[c.col_name]); })
            .attr('r', function(c) { return 0; })
            .attr('stroke', function(c) { return color(c.col_name); })
            .style('fill', function(c) { return color(c.col_name); }) 
            .attr('tabindex', '0')
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
            .on('focus', tip.show)
            .on('blur', tip.hide)
        .merge(circle)
        .transition(d3.transition().duration(500))
            .attr('cx', function(c) { return x(c.year); })
            .attr('cy', function(c) { return y(c[c.col_name]); })
            //.attr('stroke', function(c) { return color(c.col_name); })
            .attr('r', function(c) { return 3; });         
    
            console.log('elliott', currKey)
    $('.age-label .years').text(formatAgeGroup(currKey) + ' years');
} // end drawLine

function formatAgeGroup(age) {   
   return ((age.replace(/</, '< ')).replace(/-/, ' - ')).replace(/>/, '> '); 
}