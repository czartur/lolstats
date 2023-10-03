const ctx = {
    margin : {top: 10, right: 30, bottom: 30, left: 50},
    width : 500,
    height : 400,
};
ctx.width -= ctx.margin.left + ctx.margin.right;
ctx.height -= ctx.margin.top + ctx.margin.bottom;

const scale = {
    x : d3.scaleLinear()
        .domain([0, 15000])
        .range([ctx.margin.left, ctx.width - ctx.margin.right ]),
    y : d3.scaleLinear()
        .domain([0, 15000])
        .range([ctx.height - ctx.margin.bottom, ctx.margin.top ]),
};

function updateHeatmap(){
    // gather input options
    const championName = d3.select("#input-box").property("value");
    const minute = d3.select("#slider").property("value");

    d3.json("data/heatmap_br1_challenger.json").then(function (data){
        const svg = d3.select("#svg");
        
        if(Object.keys(data).includes(championName) == false) return;

        // density data computation
        var densityData = d3.contourDensity()
            .x(function(d) { return scale.x(d.x); })
            .y(function(d) { return scale.y(d.y); })
            .size([ctx.width, ctx.height])
            .bandwidth(10)
            (data[championName][minute])
        var maxVal = d3.max(densityData, (d) => (d.value))
        var minVal = d3.min(densityData, (d) => (d.value))

        // color scale
        var color = d3.scaleLinear()
            .domain([minVal, maxVal]) // Points per square pixel.
            .range(["black", "red"])
    
        
        // removing old data
        d3.select("#heatmap-data").remove();
        d3.select("#champion-pic").remove();
        
        // insert champion square asset
        d3.select("square")
            .attr("id", "champion-pic")
            .append("svg:image") 
            .attr("xlink:href", `http://ddragon.leagueoflegends.com/cdn/13.19.1/img/champion/${championName}.png`);

        // inserting data to shape
        svg.append("g")
            .attr("id", "heatmap-data")
            .selectAll("path")
            .data(densityData)
            .enter().append("path")
            .attr("d", d3.geoPath())
            .attr("fill", function(d) { return color(d.value); });
        

    });            
}

function initSlider(){
    // html block
    d3.select("#controls").append("p") // append paragraph
        .text("Minute: ")
        .append("input") // append input
            .attr("id", "slider")
            .attr("type", "range")
            .attr("min", 0)
            .attr("max", 30)
            .attr("value", 0)
        .append("output") // append output
            .attr("id", "slider-output")
            .text(0);
    
    // deploy listener
    const slider = d3.select("#slider");
    const output = d3.select("#slider-output");
    slider.on("input", function(){
        const sliderValue = +this.value; 
        output.text(sliderValue);
        updateHeatmap();
    });
}

function initInputBox(){
    d3.json("data/heatmap_br1_challenger.json").then(function(data){
        // html block
        d3.select("#controls").append("p")
        .append("label") // append label
            // .attr("for", "options-input")
            .text("Select a champion: ")
        .append("input") // append input
            .attr("id", "input-box")
            .attr("type", "text")
            .attr("list", "options-list")
        .append("datalist") //append datalist
            .attr("id", "options-list") 

        var championList = Object.keys(data);
        d3.select("#options-list")
            .selectAll("option")
            .data(championList)
            .enter()
            .append("option")
            .attr("value", d => d);
            
        // deploy listener
        const box = d3.select("#input-box");
        box.on("input", function(){
            const boxValue = this.value;
            if(championList.includes(boxValue)){
                updateHeatmap();
            }
        });
    });
    

}

function initAxis(){ 
    const svg = d3.select("#svg");

    // append x axis
    svg.append("g")
        .attr("transform", `translate(0, ${ctx.height})`)
        .call(d3.axisBottom(scale.x).tickFormat((d) => d3.format(".2s")(d)));
    
    // append y axis
    svg.append("g")
        .call(d3.axisLeft(scale.y).tickFormat((d) => d3.format(".2s")(d)));
}

function initTerrain(){
    d3.select("#svg").append("svg:image")
        .attr("xlink:href", "assets/terrain.jpg")
        .attr("width", ctx.width)
        .attr("height", ctx.height);
}

function createViz(){
    const mainDiv = d3.select("#main");
    // append heatmap svg
    mainDiv.append("svg")
        .attr("width", ctx.width + ctx.margin.left + ctx.margin.right)
        .attr("height", ctx.height + ctx.margin.top + ctx.margin.bottom)
        .append("g")
    .attr("id", "svg")
        .attr("transform", `translate(${ctx.margin.left},${ctx.margin.top})`);
    
    mainDiv.append("svg")
        .attr("id", "square")
        .attr("width", ctx.width + ctx.margin.left + ctx.margin.right)
        .attr("hwight", 100)
        .attr("transform", `translate()`)

    // append controls
    mainDiv.append("g")
        .attr("id", "controls");

    initInputBox();
    initSlider();
    
    initAxis();
    initTerrain();

}
