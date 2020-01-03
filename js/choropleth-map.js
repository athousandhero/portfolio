/*
*    choropleth-map.js
*    Adapted from:
*    Mike Bostock at bl.ocks.org https://bl.ocks.org/mbostock/4060606
*    Basic US State Map - D3, http://bl.ocks.org/michellechandra/0b2ce4923dc9b5809922
*    and Mastering Data Visualization with D3.js, Lesson 8.4 Choropleth maps
*    50 US Stages GeoJSON file from Eric Celesete https://eric.clst.org/tech/usgeojson/
*/

var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");

var cleanData;
var stateData = d3.map(); // creates a d3 map

// D3 Projection
var projection = d3.geoAlbersUsa()
    .translate([width/2, height/2]) // translate to center of screen
    .scale([1000]); // scale things down to show entire US

var path = d3.geoPath() // creates new geographic path generator with default settings that converts GeoJSON to SVG paths
    .projection(projection);  // tells path generator to use albersUsa projection

// x scale 
var x = d3.scaleLinear().domain([40, 75]).rangeRound([600, 860]);

// color scale
var color = d3.scaleThreshold().domain([45, 50, 55, 60, 65, 70, 75]).range(d3.schemePurples[8]);
    
// create legend
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0, 40)");

g.selectAll("rect")
    .data(color.range().map(function(d) { // for each color in the color scale range
        d = color.invertExtent(d); // gets domain bound for each
        
        if (d[0] == null) d[0] = x.domain()[0];
        if (d[1] == null) d[1] = x.domain()[1];
        return d;
    }))
    .enter()
    .append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return color(d[0]); }); 

g.append("text")
    .attr("class", "legend-label")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("text-anchor", "start")
    .text("Fertility Rate");

g.attr("class", "axisLegend")
    .call(d3.axisBottom(x)
        .tickSize(13)
        .tickFormat(function(x) { return x; })
        .tickValues(color.domain()))
    .select('.domain').attr('stroke', null);


var svgSub = svg.append("g")
    .attr("class", "map");

// event listeners
//$('#option-select').on('change', update)

// tooltip
var tip = d3.tip().attr('class', 'd3-tip')
    .html(function(d) {
        var text  = '<strong class=\'dataName\'>State:</strong><span class=\'dataValue\'> ' + d.properties.NAME + '</span><br/>';
            text += '<strong class=\'dataName\'>Fertility Rate:</strong><span class=\'dataValue\'> ' + d.properties.fertilityRate + '</span><br/>';
            text += '<strong class=\'dataName\'>Births:</strong><span class=\'dataValue\'> ' + d.properties.births + '</span><br/>';
           /*  text += '<strong class=\'dataName\'>Death Rate:</strong><span class=\'dataValue\'> ' + d.properties.deaths + '</span><br/>';
            text += '<strong class=\'dataName\'>Deaths:</strong><span class=\'dataValue\'> ' + d.properties.deathRate + '</span><br/>'; */
        return text; 
    });

svg.call(tip);

/*  
Before v5
d3.queue()
    .defer(d3.json, "https://d3js.org/us-10m.v1.json")
    .defer(d3.tsv, "data/map.tsv", function(d) { unemployment.set(d.id, +d.rate); })
    .await(ready);
*/    

var promises = [
    d3.json("data/gz_2010_us_040_00_5m.json"),
    d3.csv("data/50_states_cdc_stats.csv",  function(d) {
        stateData.set(d.State, {state: d.State, births: +d.Births, fertilityRate: +d.Fertility_Rate, deaths: +d.Deaths, deathRate: +d.Death_Rate});
    })
]

Promise.all(promises).then(function(data) {
    cleanData = data[0];
    update();
}).catch(function(error){
    console.log(error);
});

function update() {
    us = cleanData;
    // loop through each state in stateData
    stateData.each(function(o, s) { // s is stateName & o is value of state obj           
        var states50Array = us.features; // us.features is array of 50 states
        var i = 0;

        // find corresponding state inside GeoJSON
        while(true) {
            // when state found, copy data value into GeoJSON feature
            if(states50Array[i].properties.NAME === s) {
                states50Array[i].properties.births = o.births;
                states50Array[i].properties.fertilityRate = o.fertilityRate;
                states50Array[i].properties.deaths = o.deaths;
                states50Array[i].properties.deathRate = o.deathRate;
                break;
            }
            i++;
        }
    })

    // bind data to svg and create one path per GeoJSON feature
    var paths = svgSub.selectAll("path")
        .data(us.features);
        
        paths.enter()
            .append("path")
                .attr("d", path)
                .style("fill", '#fff')
                .style("stroke", "#fff")
                .style("stroke-width", "0")
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                .on('focus', tip.show)
                .on('blur', tip.hide)
            .merge(paths)
            .transition(d3.transition().duration(300))
                .style("stroke", "#444")
                .style("stroke-width", "1")
                .style("fill", function(d) { return color(d.properties.fertilityRate); });
} 
