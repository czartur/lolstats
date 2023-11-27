var ctx = {
  elo: "challenger",
  region: "", // input field
  champions: new Set(), // champions added
  championIdx: {}, // champion --> idx (used to trigger area highlight)
  stats: {}, // champion --> attribute 
  championList: [], // list with all champions
  regionMap: {}, // map region name to region code
  wantedStats: {
    general: ["popularity", "gameEndedInSurrender", "win", "timePlayed"],
    gameplay: ["kda", "visionScore", "structureScore", "damagePerGold"],
    communication: ['commandPings', 'onMyWayPings', 'getBackPings', 'assistMePings', 'enemyMissingPings', 'enemyVisionPings'],
  },
  color: d3.scaleOrdinal(d3.schemeCategory10), // associate champions to unique colors
};

function updateRegion(){
    var region = d3.select("#input-region").property("value"); 

    // remove previous pic
    // d3.select("#region-pic").remove();
    
    // check if region is valid
    if(!Object.keys(ctx.regionMap).includes(region)) return;
    ctx.region = region;

    d3.json(`data/stats/stats_${ctx.regionMap[ctx.region]}_${ctx.elo}.json`).then((data) => {
      ctx.stats = data;

      // what we need to update next 
      updateRadar();
      updateRegionPic();
    });    
}

function updateChampions(newChampion = "", mode = "add"){
    if(mode == "add"){
      if(newChampion == "")
        newChampion = d3.select("#input-champion").property("value");
      if(!ctx.championList.includes(newChampion)) return;
      ctx.champions.add(newChampion);
    }
    else{ // mode == remove
      ctx.champions.delete(newChampion);
    }
    
    // update champion indexes
    ctx.championIdx = {};
    var index = 0;
    for(let champion of ctx.champions){
      ctx.championIdx[champion] = index++;
    }

    // what we need to update next 
    updateRadar();
    updateLegend();
    updateFootnote();
}

function updateFootnote(){
    let msg = ctx.champions.size ? "Double click a champion to delete it" : "Add at least one champion to start"; 
    d3.select(".footnote")
        .html(msg);
}

function updateRadar(){ 
    
    // check inputs 
    if(ctx.region == "" || !ctx.champions.size){
      d3.select(".radar").selectAll("svg").remove();
      return;
    }
    const data = ctx.stats;
    
    // setup radar function parameters
    var margin = {top: 100, right: 100, bottom: 100, left: 100},
        width = Math.min(400, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
        
    var radarChartOptions = {
        w: width,
        h: height,
        margin: margin,
        maxValue: 0.5,
        levels: 5,
        roundStrokes: false,  
        color: ctx.color,
    };

    // extract input
    for(let statsCategory in ctx.wantedStats){
        var inputData = [];
        for(let champion of ctx.champions){
          var championData = [];
          for(let stat of ctx.wantedStats[statsCategory]){
            championData.push({"axis" : stat, "norm" : data[champion][stat].norm, "abs" : data[champion][stat].abs});
          }
          inputData.push(championData);
        }

        // create/update radar
        let group_id = `#${statsCategory}-stats`; 
        RadarChart(group_id, inputData, radarChartOptions);
    }
}

function updateLegend(){
    var picWidth = 100,
        picHeight = 100,
        rectWidth = 100,
        rectHeight = 20;

    var svg = d3.select(".legend").select("svg");
    
    svg.selectAll("g")
      .data(ctx.champions, (d,i) => d)
      .join(
        enter => {
          // append new group
          var groupEnter = enter.append("g");

          // image
          groupEnter.append("image")
              .attr("xlink:href", d => `https://ddragon.leagueoflegends.com/cdn/13.22.1/img/champion/${d}.png`)  
              .attr("width", picWidth)
              .attr("height", picHeight)
              .attr("cursor", "pointer")
              // triger radar area highlights using champion idx
              .on("mouseover", (ev,d) => {
                d3.selectAll(`#radar-area-${ctx.championIdx[d]}`).dispatch("mouseover");
              })
              .on("mouseout", (ev,d) => {
                d3.selectAll(`#radar-area-${ctx.championIdx[d]}`).dispatch("mouseout");
              }); 
              
          // colored rectangle
          groupEnter.append("rect")
              .attr("width", rectWidth)
              .attr("height", rectHeight)
              .attr("transform", `translate(0,${picHeight})`)
              .attr("fill", (d,i) => ctx.color(i));
          
          // champion name
          groupEnter.append("text")
              .text(d => d)
              .attr("x", picHeight/2)
              .attr("text-anchor", "middle")
              .attr("font-size", "14px")
              .attr("transform", `translate(0,${picHeight + rectHeight - 5})`);

          // translate group
          groupEnter
              .transition()
              .duration(1000)
              .attr("transform", (d,i) => `translate(${i * (100 + 20)}, 0)`);
       },
        update => {
          // update position
          update
            .transition()
            .duration(1000)
            .attr("transform", (d,i) => `translate(${i * (100 + 20)}, 0)`);

          // update color
          update.select("rect")
            .attr("fill", (d,i) => ctx.color(i));
        },
        exit => exit
            .transition()
            .duration(1000)
            .style("transform", "scale(0)")
            .remove(),
      );
  
    // listener: double click to remove image
    svg.selectAll("image")
      .on("dblclick", function (_, d) {
        updateChampions(newChampion = d, mode = "remove");
      });
}

function updateRegionPic(){
    var svg = d3.select("#group-region").select("svg");
    
    //remove previous picture
    d3.select("#region-pic").remove();

    // add picture
    svg.append("image") 
      .attr("id", "region-pic")
      .attr("xlink:href", `assets/${ctx.regionMap[ctx.region]}.png`)
      .attr("width", 100)
      .attr("height", 100);
}

function initInputBox(inputContainer, name, data, pic = true, add = false){
    const label = add ? `Add a ${name} : ` : `Select a ${name}: `;
    const group_id = `group-${name}`;
    const input_id = `input-${name}`;
    const datalist_id = `${name}-list`;
    const button_id = `button-${name}`;

    var g = inputContainer.append("g")
    .attr("id", group_id)
    .style("display", "flex")
    .style("align-items", "center");
    
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

    if(pic){
      // add svg for picture
      g.append("svg")
        .attr("width", 150)
        .attr("height", 150);
    }

    // add event listeners
    d3.select("#" + input_id).on("input", () => {
      updateRegion();
      updateChampions();
    });
}

function initLegend(legendContainer){
    // create SVG
    legendContainer.append("svg")
      .attr("width", "1000")
      .attr("height", "150");
}

function loadData(){

    promises = [
      d3.json("data/championlist.json"),
      d3.json("data/regionmap.json"),
    ];
    
    Promise.all(promises).then(([championList, regionMap]) => {
      ctx.championList = championList;
      ctx.regionMap = regionMap;
      
      // input boxes
      let inputContainer = d3.select(".inputs");
      // 1. region  
      initInputBox(inputContainer, "region", Object.keys(ctx.regionMap));
      // 2. champion 
      initInputBox(inputContainer, "champion", ctx.championList, true, true); 
      
      // champion list legend
      let legendContainer = d3.select(".legend");
      initLegend(legendContainer);

      // radar charts
      radarContainer = d3.select(".radar");
      // 1. general stats
      radarContainer.append("g").attr("id", "general-stats");
      // 2. gameplay stats
      radarContainer.append("g").attr("id", "gameplay-stats");
      // 3. communication stats
      radarContainer.append("g").attr("id", "communication-stats");
      
      // toggle footnote
      updateFootnote();
    });
}

function createViz(){ 
    loadData();
}

