var ctx = {
  elo: "challenger",
  region: "", // input field  
  champion: "", // input field
  minute: 0, // input field
  points: {}, // champion --> data
  regionMap: {}, // region name --> region id
  championList: {} // all available champions
};

var heatmapData = {};

const championListFile = "data/championlist.json"
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

function updateRegion(){
    var region = d3.select("#input-region").property("value"); 

    // remove previous pic
    // d3.select("#region-pic").remove();
    
    // check if region is valid
    if(!Object.keys(ctx.regionMap).includes(region)) return;
    ctx.region = region;

    d3.json(`data/heatmap/heatmap_${ctx.regionMap[ctx.region]}_${ctx.elo}.json`).then((data) => {
      ctx.points = data;

      // what we need to update next 
      updateRegionPic();
      updateHeatmap();
    });    
}

function updateChampion(){
    var champion = d3.select("#input-champion").property("value");

    if(!ctx.championList.includes(champion)) return;
    ctx.champion = champion;
    
    updateChampionPic();
    updateHeatmap();
}

function initInputBox(inputContainer, name, data){
    const label = `Select a ${name}`;
    const group_id = `group-${name}`;
    const input_id = `input-${name}`;
    const datalist_id = `${name}-list`;

    var g = inputContainer.append("g")
    .attr("id", group_id)
    .style("display", "flex")
    .style("align-items", "center");

    // add label
    g
    // .append("label")
      // .text(label)
    .append("input")
      .attr("id", input_id)
      .attr("type", "text")
      .attr("list", datalist_id)
      .attr("placeholder", label)
      .classed("custom-input", true)
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
      updateRegion();
      updateChampion();
    });
}

function initSlider(sliderContainer){
    // text preceding slider
    // sliderContainer.append("text")
    //     .text("Minute:")
    //     .style("fill", "white")
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("dy", "-0.5em");

    // input minute
    sliderContainer.append("input")
        .attr("type", "range")
        .attr("min", 0)
        .attr("max", 40)
        .attr("value", 0)
        .attr("step", 1)
        .on("input", function(){
          ctx.minute = +this.value;
          d3.select(".slider").select("input[type=text]")
            .property("value", ctx.minute > 0 ? ctx.minute : "");
          updateHeatmap();
        });

    // output minute 
    sliderContainer.append("input")
        .attr("id", "input-slider")
        .attr("type", "text")
        .attr("placeholder", "Min")
        .on("input", function(){
          ctx.minute = Math.min(40, +this.value);
          this.value = ctx.minute > 0 ? ctx.minute : "";
          d3.select(".slider").select("input[type=range]")
            .property("value", ctx.minute);
          updateHeatmap();
        });
}

function initTerrain(heatmapContainer){
    let svg = heatmapContainer.select("svg");
    
    svg.append("g")
      .attr("id", "terrain")
      .attr("transform", `translate(${cfg.margin.left},${cfg.margin.top})`)
      .append("svg:image")
      .attr("xlink:href", image_path)
      .attr("width", cfg.width)
      .attr("height", cfg.height);
}

function initAxis(heatmapContainer){
    let svg = heatmapContainer.select("svg");

    // x axis
    let x_axis = svg.append("g")
        .attr("transform", `translate(0, ${cfg.height + cfg.margin.top})`) 
        .call(d3.axisBottom(scale.x).tickFormat((d) => d3.format(".2s")(d)));
    x_axis.selectAll("line")
        .style("stroke", "white");
    x_axis.selectAll("text")
        .style("fill", "white"); 

    // y axis
    let y_axis = svg.append("g")
        .attr("transform", `translate(${cfg.margin.left}, 0)`)
       .call(d3.axisLeft(scale.y).tickFormat((d) => d3.format(".2s")(d)));
    y_axis.selectAll("line")
        .style("stroke", "white");
    y_axis.selectAll("text")
        .style("fill", "white"); 
}

function updateRegionPic(){
    var svg = d3.select("#group-region").select("svg");
    
    // remove previous pic
    // d3.select("#region-pic").remove();
    
    // add picture
    svg.append("image") 
      .attr("id", "region-pic")
      .attr("xlink:href", `assets/${ctx.regionMap[ctx.region]}.png`)
      .attr("width", 100)
      .attr("height", 100);
}

function updateChampionPic(){
    var svg = d3.select("#group-champion").select("svg");
  
    // remove previous pic
    // d3.select("#champion-pic").remove();
    
    // add picture
    svg.append("image") 
      .attr("id", "champion-pic")
      .attr("xlink:href", `https://ddragon.leagueoflegends.com/cdn/13.22.1/img/champion/${ctx.champion}.png`)
      .attr("width", 100)
      .attr("height", 100);
}

function updateHeatmap(){
    var svg = d3.select(".heatmap").select("svg");
    
    // check inputs
    if(ctx.region == "" || ctx.champion == "") return;

    // remove any density-data in place
    d3.select("#density-data").remove();
    d3.select("#temp-legend").remove();

    var data = ctx.points[ctx.champion][ctx.minute];

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

function loadData(){
  promises = [
    d3.json("data/championlist.json"),
    d3.json("data/regionmap.json")
  ];

  Promise.all(promises).then(([championList, regionMap]) => {
    ctx.championList = championList;
    ctx.regionMap = regionMap;
  
    // input box
    let inputContainer = d3.select(".inputs");
    // 1. region 
    initInputBox(inputContainer, "region", Object.keys(ctx.regionMap)); 
    // 2. champion 
    initInputBox(inputContainer, "champion", championList);
  
    
    let heatmapContainer = d3.select(".heatmap");
    // create svg
    heatmapContainer.append("svg")
      .attr("width", cfg.width + cfg.margin.left + cfg.margin.right + 500)
      .attr("height", cfg.height + cfg.margin.top + cfg.margin.bottom);

    // terrain
    initTerrain(heatmapContainer);

    // axis
    initAxis(heatmapContainer);
    
    // minute slider
    let sliderContainer = d3.select(".slider");
    initSlider(sliderContainer);
  });
}

function createViz(){
   loadData();
}
