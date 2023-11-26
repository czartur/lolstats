var heatmapData = {};

const regionMap = {
  "Europe West": "euw1",
  "Europe Nordic & East": "eun1",
  "Turkey" : "tr1",
  "Russia": "ru",
  "Brazil": "br1",
  "North America": "na1",
  "Latin America North": "la1",
  "Latin America South": "la2",
  "Japan" : "jp1",
  "Oceania" : "oc1",
};

const championListFile = "data/championList.json"
const elo = "challenger";

let image_path = "assets/SRFull.png";
var cfg = {
      width : 500,
      height : 500,
      margin : {top: 10, right: 30, bottom: 30, left: 50},
};

var scale = {
    x : d3.scaleLinear()
        .domain([0, 15000])
        .range([cfg.margin.left, cfg.width + cfg.margin.left]),
    y : d3.scaleLinear()
        .domain([0, 15000])
        .range([cfg.height + cfg.margin.top, cfg.margin.top ]),
};

function initInputBox(inputContainer, name, data){
    const label = `Select a ${name}: `;
    const group_id = `group-${name}`;
    const input_id = `input-${name}`;
    const datalist_id = `${name}-list`;

    var g = inputContainer.append("g")
    .attr("id", group_id)
    .style("display", "flex")
    .style("align-items", "center")
    
    // add label
    g.append("label")
      .text(label)
    .append("input")
      .attr("id", input_id)
      .attr("type", "text")
      .attr("list", datalist_id)
    .append("datalist")
      .attr("id", datalist_id)
      .style("margin-right", "10px");


    // add option list
    d3.select("#" + datalist_id)
      .selectAll("option")
      .data(data)
      .enter()
      .append("option")
      .attr("value", d => d);
    
    // add svg for picture
    g.append("svg")
      .attr("width", 150)
      .attr("height", 150);
    
    // add event listeners
    d3.select("#" + input_id).on("input", () => {
      updateRegionPic();
      updateChampionPic();
      updateDensityChart();
    });
}

function initSlider(inputContainer){
    // append slider group
    var sliderContainer = inputContainer.append("g")
      .attr("id", "minute-slider")
      .attr("transform", `translate(${cfg.margin.left},${cfg.margin.top + cfg.height + 20})`);
    
    // text preceding slider
    sliderContainer.append("text")
        .text("Minute:")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "-0.5em");

    // input minute
    sliderContainer.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", 30)
        .attr("value", 0)
        .attr("step", 1)
        .on("input", function(){
          let minute = +this.value;
          d3.select("#minute-slider").select("output")
            .text(minute);
          updateDensityChart();
        });

    // output minute 
    sliderContainer.append("output")
        .text("0"); 
}

function initTerrain(svg){
    svg.append("g")
      .attr("id", "terrain")
      .attr("transform", `translate(${cfg.margin.left},${cfg.margin.top})`)
      .append("svg:image")
      .attr("xlink:href", image_path)
      .attr("width", cfg.width)
      .attr("height", cfg.height);
}

function initAxis(svg){
    // x axis
    svg.append("g")
        .attr("transform", `translate(0, ${cfg.height + cfg.margin.top})`) 
        .call(d3.axisBottom(scale.x).tickFormat((d) => d3.format(".2s")(d)));

    // y axis
    svg.append("g")
        .attr("transform", `translate(${cfg.margin.left}, 0)`)
        .call(d3.axisLeft(scale.y).tickFormat((d) => d3.format(".2s")(d)));
}

function updateRegionPic(){
    var svg = d3.select("#group-region").select("svg");

    var region = d3.select("#input-region").property("value"); 
  
    // remove previous pic
    d3.select("#region-pic").remove();
    
    // check if champion is valid (Brazil has every champ in the list **)
    if(!Object.keys(regionMap).includes(region)) return;
    
    // add picture
    svg.append("image") 
      .attr("id", "region-pic")
      .attr("xlink:href", `assets/${regionMap[region]}.png`)
      .attr("width", 100)
      .attr("height", 100);
}

function updateChampionPic(){
    var svg = d3.select("#group-champion").select("svg");

    var champion = d3.select("#input-champion").property("value"); 
  
    // remove previous pic
    d3.select("#champion-pic").remove();
    
    // check if champion is valid (Brazil has every champ in the list **)
    if(!Object.keys(heatmapData['Brazil']).includes(champion)) return;
    
    // add picture
    svg.append("image") 
      .attr("id", "champion-pic")
      .attr("xlink:href", `https://ddragon.leagueoflegends.com/cdn/13.22.1/img/champion/${champion}.png`)
      .attr("width", 100)
      .attr("height", 100);

}

function updateDensityChart(){
    var svg = d3.select(".heatmap").select("svg");
    
    // retrieve input values
    var region = d3.select("#input-region").property("value");
    var champion = d3.select("#input-champion").property("value"); 
    var minute = d3.select("#minute-slider").select("input").property("value");

    // remove any density-data in place
    d3.select("#density-data").remove();
    d3.select("#temp-legend").remove();
    
    // trigger the function only when both fields are filled
    // and only when they are valid
    if(!Object.keys(regionMap).includes(region)) return;
    if(!Object.keys(heatmapData[region]).includes(champion)) return;

    var data = heatmapData[region][champion][minute];

    // density data computation
    var densityData = d3.contourDensity()
        .x(function(d) { return scale.x(d.x); })
        .y(function(d) { return scale.y(d.y); })
        .size([cfg.width + cfg.margin.left, cfg.height + cfg.margin.top])
        .bandwidth(10)
        (data);

    var maxVal = d3.max(densityData, (d) => (d.value))
    var minVal = d3.min(densityData, (d) => (d.value))
    
    // color scale
    var color = d3.scaleLinear()
        .domain([minVal, maxVal]) // Points per square pixel.
        .range(["blue", "red"])

    // "populate" density map 
    var dataG = svg.append("g")
        .attr("id", "density-data")
        .selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", function(d) { return color(d.value); })
        .style("opacity", 0.3);

    // Color legend
    var legendWidth = 50;
    var legendHeight = 10; 
    let legendG = svg.append("g")
          .attr("id", "temp-legend")
          .attr("transform", `translate(${cfg.margin.right + cfg.width + cfg.margin.left}, ${10 + cfg.margin.top})`);

    // Append a title to the legend
    legendG.append("text")
        .attr("x", 5)
        .attr("y", -5)
        .text("Legend")
        .style('font-size', '12px')
        .style('font-family', 'Helvetica Neue');
    legendG.selectAll("rect")
        .data(densityData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * (legendHeight)) 
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", (d) => color(d.value));
}

function loadData(chartContainer, inputContainer, sliderContainer){
  
  var svgChart = chartContainer.select("svg");
  var svgInput = inputContainer.select("svg");

  promises = [d3.json(championListFile)];

  for(var region in regionMap){
    promises.push(d3.json(`data/heatmap/heatmap_${regionMap[region]}_${elo}.json`));
  }

  Promise.all(promises).then((data) => {
    var index = 0;
    var championList = data[index++];

    for(var region in regionMap){
      heatmapData[region] = data[index++];
    }

    // region input box
    initInputBox(inputContainer, "region", Object.keys(regionMap));
    
    // champion input box
    initInputBox(inputContainer, "champion", championList);

    //terrain
    initTerrain(svgChart);

    // axis
    initAxis(svgChart);
    
    // minute slider
    initSlider(sliderContainer);
  });
}

function createViz(){
  var chartContainer = d3.select(".heatmap");
  var inputContainer = d3.select(".inputBoxes");
  var sliderContainer = d3.select(".slider");
  
  chartContainer.append("svg")
      .attr("width", cfg.width + cfg.margin.left + cfg.margin.right + 500)
      .attr("height", cfg.height + cfg.margin.top + cfg.margin.bottom);

  loadData(chartContainer, inputContainer, sliderContainer);
}
