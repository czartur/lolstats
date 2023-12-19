var ctx = {
  elo: "challenger",
  regionMap: {}, // map region name => region id
  attributes: { // current attributes in table
    "nominal": new Set(["champion"]),
    "percentage": new Set(["win", "popularity", "ban"]),
    "decimal": new Set(["kda", "goldEarned", "totalMinionsKilled"]),
  },
  region: {}, // current selected region
  selected: "champion",
  ascending: true,
};

function updateRegion(){
    var region = d3.select("#input-region").property("value"); 

    // remove previous pic
    // d3.select("#region-pic").remove();
    
    // check if region is valid
    if(!Object.keys(ctx.regionMap).includes(region)) return;
    ctx.region = region;
    
    // what we need to update next 
    updateTable();
    updateRegionPic();
}

function initInputBox(inputContainer, name, data, pic = true, add = false){
    const label = add ? `Add a ${name}` : `Select a ${name}`;
    const group_id = `group-${name}`;
    const input_id = `input-${name}`;
    const datalist_id = `${name}-list`;
    const button_id = `button-${name}`;

    var g = inputContainer.append("g")
    .attr("id", group_id)
    .style("display", "flex")
    .style("align-items", "center");
    
    // add label
    g.append("input")
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

    if(pic){
      // add svg for picture
      g.append("svg")
        .attr("width", 150)
        .attr("height", 150);
    }

    // add event listeners
    d3.select("#" + input_id).on("input", () => {
      updateRegion();
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

function formatter(col, value){
  const formatDecimal = d3.format(".2f");
  const formatPercentage = d3.format(".2%");
  
  if(ctx.attributes["nominal"].has(col)) return value;
  if(ctx.attributes["decimal"].has(col)) return formatDecimal(value);
  if(ctx.attributes["percentage"].has(col)) return formatPercentage(value);
}

function updateTable(){
    const tableContainer = d3.select(".table");
    const thead = tableContainer.select("thead");
    const tbody = tableContainer.select("tbody");
    const formatPercentage = d3.format(".2%");

    // clean previous data
    thead.selectAll("*").remove();
    tbody.selectAll("*").remove();
    
    // assemble all attribute names
    var attributes = new Set();
    for(let type in ctx.attributes){
      ctx.attributes[type].forEach((attr) => {attributes.add(attr)}); 
    }

    d3.json(`data/stats/stats_${ctx.regionMap[ctx.region]}_${ctx.elo}.json`).then((rawData) => {

      // format data
      let data = [];
      for(let champion in rawData){
        // include champion name + fiddlesticks bug correction...
        let newRow = { "champion": champion == "FiddleSticks" ? "Fiddlesticks" : champion };
        // include all selected attributes
        for(let attr of attributes){
          if (attr == "champion") continue; // ignore champion attr
          
          newRow[attr] = rawData[champion][attr].abs;
          
          // we want actually norm in popylarity
          // if(attr == "popularity") newRow[attr] = rawData[champion][attr].norm;
        }
        data.push(newRow);
      }
      
      // set default sorting direction and selcted columns
      ctx.ascending = true;
      ctx.selected = "champion";
      
      // coumn headers
      const columns = Object.keys(data[0]);
      const th = thead.selectAll("th")
        .data(columns)
        .enter()
        .append("th")
        .attr("id", d => `header-${d}`)
        .text(d => d)
        .on("click", (_,col) => { // repopulate table on click
          
          let curSelect = d3.select(`#header-${col}`);
          let prevSelect = d3.select(`#header-${ctx.selected}`);

          // reset CSS styling
          prevSelect.classed("selected", false);
          curSelect.classed("selected", true);
          
          // reset icon
          let imgSrc = ctx.ascending ? "assets/arrow_down.png" : "assets/arrow_up.png";
          prevSelect.select("img").remove();
          curSelect.append("img")
            .attr("src", imgSrc)
            .attr("class", "selected-icon");

          ctx.ascending ^= true; // swap sorting direction
          ctx.selected = col; // save selected col
          
          // sort data
          data.sort((a,b) => 
            ctx.ascending ? d3.ascending(a[ctx.selected], b[ctx.selected])
                          : d3.descending(a[ctx.selected], b[ctx.selected])
          );
          
          // fill body
          // clear previous body
          tbody.selectAll("tr").remove(); 
          
          const rows = tbody.selectAll("tr") 
            .data(data)
            .enter()
            .append("tr");
          
          const cells = rows.selectAll("td")
            .data(d => columns.map(col => ({ column: col, value: formatter(col, d[col]) })))
            .enter()
            .append("td")
            .html((d) => {
            
              if(d.column == "champion"){
                  return `<img src="https://ddragon.leagueoflegends.com/cdn/13.23.1/img/champion/${d.value}.png" alt="champion" class="champion-icon">${d.value}`;
              }

              return d.value;
            });
          });

      d3.select(`#header-${ctx.selected}`).dispatch("click"); // trigger click for a first population
    });
}

function loadData(){
    let promises = [
      d3.json("data/regionmap.json"),
      d3.json("data/attributes.json"),
    ];
    
    Promise.all(promises).then(([regionMap, attributes]) => {
      ctx.regionMap = regionMap;
      
      // region input
      inputContainer = d3.select(".inputs");
      initInputBox(inputContainer, "region", Object.keys(ctx.regionMap));
      
      // table
      const table = d3.select(".table").append("table");
      const thead = table.append("thead");
      const tbody = table.append("tbody");
    });
}

function createViz(){
    loadData();
}
