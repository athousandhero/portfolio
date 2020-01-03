/*
*    main.js
*    bubble chart
*    adapted from Mastering Data Visualization with D3.js, Project 2 - Gapminder Clone
*/

// 1. declare global vars:
// 1a. margin (left, right, top and bottom)
// 1b. width
// 1c. height
// 1d. g - select #chart-area, append svg element (set width and height attrs to it), append group element (set attr to transform it to account for left and right margins
// 2. declare axis groups vars (they will hold the x and y axis):
// 2a. xAxisGroup - append group element to 'g' var and set class attr to 'x axis' and transform it to set to bottom of chart
// 2b. yAxisGroup - append group element to 'g' var and set class attr to 'y axis'
// 3. declare x and y scale vars - set scale, domain, range, paddingInner, paddingOuter, etc.


var margin = { left: 70, right: 20, top: 20, bottom: 75 };

var width = 580 - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom;

var yearVar = 0;
var maxYears;
const tDuration = 100;
var interval;
var cleanData;
//var colorsArr = ['#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494'];
var colorsArr = ['#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0'];
var gdpIntervals = [
    { label: '< $2,500', value1: 2500, value2: null},
    { label: '$2,500 - $4,999', value1: 2500, value2: 4999},
    { label: '$5,000 - $9,999', value1: 5000, value2: 9999},
    { label: '> $10,000', value1: null, value2: 10000}
];

// append svg object to page
var svg = d3.select('#chart-area')
    .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'); 

var legend = g.append('g')
    .attr('transform', 'translate(' + (width-10) + ',' + 0 + ')');

// event listeners
$('#play-button')
    .on('click', function() {
        var btn = $(this);
        if(btn.text() === 'Play') {
            btn.text('Pause');
            interval = setInterval(step, tDuration);
        } else {
            btn.text('Play');
            clearInterval(interval);
        }     
    })

$('#reset-button')
    .on('click', function() {
        yearVar = 0;     
        update(cleanData[0].countries, '1951');
    })

$('#gdp-select')
    .on('change', function() {
        update(cleanData[0].countries, '1951');
    })

$('#date-slider').slider({
    min: 1950,
    max: 2015,
    step: 1,
    slide: function(e, ui) {
        yearVar = ui.value - 1950;
        update(cleanData[yearVar].countries, ui.value);
    }
})

// scales
var xScale = d3.scaleLinear().domain([0, 100]).range([0, width]);
var yScale = d3.scaleLinear().domain([0,9]).range([height, 0]);
var areaScale = d3.scaleLinear().domain([2128, 1410848000]).range([25*Math.PI, 625*Math.PI]); // population (area) scale for circle size
var gdpScale = d3.scaleThreshold().domain([2500, 5000, 10000, 50000, 100000, 200000]).range(colorsArr);

// axis
var xAxis = d3.axisBottom(xScale).tickFormat(function(d) { return d; });
var xAxisGroup = g.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height +')').call(xAxis);
var yAxis = d3.axisLeft(yScale).tickFormat(function(d) { return d; });
var yAxisGroup = g.append('g').attr('class', 'y axis').call(yAxis);

// chart labels
var yearLabel = g.append('text').attr('y', height-10).attr('x', width-40).attr('class', 'year-label').attr('text-anchor', 'middle').text('1800');
var xAxisLabel = g.append('text').attr('y', height + 50).attr('x', width / 2).attr('class', 'chart-label').attr('text-anchor', 'middle').text('Life Expectancy (Years)');
var yAxisLabel = g.append('text').attr('transform', 'rotate(-90)').attr('y', -40).attr('x', -150).attr('class', 'chart-label').attr('text-anchor', 'middle').text('Total Fertility Rate');

// tooltip
var tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {
        var text  = '<strong class=\'dataName\'>Country:</strong><span class=\'dataValue country\'> ' + d.country + '</span><br/>';
            text += '<strong class=\'dataName\'>Total Fertility Rate:</strong><span class=\'dataValue\'> ' + d.tfr + '</span><br/>';
            text += '<strong class=\'dataName\'>Life Expectancy:</strong><span class=\'dataValue\'> ' + d3.format('.2f')(d.life_exp) + ' years</span><br/>';
            text += '<strong class=\'dataName\'>GDP per Capita:</strong><span class=\'dataValue\'> ' + (d.gdp === 0 ? 'N/A' : d3.format('$,.0f')(d.gdp)) + '</span><br/>';
            text += '<strong class=\'dataName\'>Population:</strong><span class=\'dataValue\'> ' + d3.format(',.2r')(d.population) + '</span><br/>';

        return text; 
    });

g.call(tip);

// legend
colorsArr.forEach(function(color, i) {
    var legendRow = legend.append('g')
        .attr('transform', 'translate(0, ' + (i * 20) + ')');

    legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', color);
        
    legendRow.append('text')
        .attr('x', -10)
        .attr('y', 10)
        .attr('text-anchor', 'end')
        .style('text-transform', 'capitalize')
        .text(gdpIntervals[i].label);
})

// read in data
d3.csv('data/worlddata.csv', function(data) {
    cleanData = [];
    var keys = d3.map(data, function(d) { return d.year; }).keys();

    keys.forEach(function(y) {
        var countryYearObj = {
            year: +y,
            countries: []
        }
        cleanData.push(countryYearObj);
    })

    data.forEach(function(d) {
        var i = 0;
        var stop = false;

        while(!stop) {
            if(cleanData[i].year === +d.year) {                
                var countryObj = {
                    country: d.country,
                    population: +d.population,
                    life_exp: +d.life_exp,
                    tfr: +d.tfr,
                    gdp: +d.gdp
                }

                cleanData[i].countries.push(countryObj);
                stop = true;
            }

            i++;
        }
    })

    //console.log(cleanData)

    maxYears = cleanData.length - 1; // set maxYears to total num years for which we have data

    // initial run
    update(cleanData[0].countries, cleanData[0].year);
})

function step() {    
    yearVar = yearVar === maxYears ? 0 : yearVar+1; // if we've reached last year, loop back to 0 (which represents first year of data)
    try{
        update(cleanData[yearVar].countries, cleanData[yearVar].year);
    } catch(e) {
        console.log(yearVar)
    }
}

// pass in array of country objs for a given year and year itself as string
function update(countriesArr, year) {
    var t = d3.transition().duration(tDuration);
    var gdpLabel = $('#gdp-select').val();
    var gdpObj = gdpIntervals.filter(function(g) { return g.label === gdpLabel; }).shift();

    countriesArr = countriesArr.filter(function(countryObj) {
        if(gdpLabel === 'all')
            return true;
        else {
            var v1 = gdpObj.value1;
            var v2 = gdpObj.value2;

            if(v1 && v2) { return countryObj.gdp >= v1 && countryObj.gdp <= v2; } 
            else if(v1) { return countryObj.gdp < v1; } 
            else { return countryObj.gdp > v2; }
        }
    }) 

    // JOIN new data with old elements
    var circles = g.selectAll('circle')
        .data(countriesArr, function(countryObj) {
            console.log('in data', countryObj.country)
            return countryObj.country;
        });

        console.log(circles)
    // EXIT old elements not present in new data
    circles.exit().remove();
  
    // ENTER new elements present in new data
    circles.enter()
        .append('circle')
            .attr('cy', function(countryObj) { return yScale(countryObj.tfr); })
            .attr('cx', function(countryObj) { return xScale(countryObj.life_exp); })
            .attr('class', 'circle')
            /*.attr('fill', function(countryObj) { 
                return countryObj.gdp === 0 ? '#bdb9b9' : gdpScale(countryObj.gdp); })*/
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
        .merge(circles) // UPDATE old elements present in new data AND new elements present in data
        .transition(t)
            .attr('cy', function(countryObj) { return yScale(countryObj.tfr); })
            .attr('cx', function(countryObj) { /*console.log(year, countryObj.country, xScale(countryObj.population));*/ return xScale(countryObj.life_exp); })
            .attr('r', function(countryObj) { return Math.sqrt(areaScale(countryObj.population)/Math.PI); })
            .attr('fill', function(countryObj) { return countryObj.gdp === 0 ? '#b3b1b1' : gdpScale(countryObj.gdp); });

    yearLabel.text(year);
    $('#year').text(year);
    $('#data-slider').slider('value', year);
}
