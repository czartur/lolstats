const ctx = {
    margin : {top: 10, right: 30, bottom: 30, left: 50},
    width : 400,
    height : 300,
    transitiontTime: 1000
};
ctx.width -= ctx.margin.left + ctx.margin.right;
ctx.height -= ctx.margin.top + ctx.margin.bottom;

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


ctx.selectedCountries = ["Brazil", "Europe West", "Europe Nordic & East","Russia","Japan"];
ctx.Attributes = [
    "assists",
    "baronKills",
    "deaths",
    "dragonKills",
    "goldEarned",
    "inhibitorKills",
    "kills",
    "neutralMinionsKilled",
    "timeCCingOthers",
    "timePlayed",
    "totalDamageDealt",
    "totalHealsOnTeammates",
    "turretKills",
    "visionScore",
    "kda",
    "structureKills",
    "monsterKills"
  ];
function createBarPlot(data, championName, attr, countries) {
    const svg = d3.select("#svg");
    
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    svg.selectAll("*").remove();
    const chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const x = d3.scaleBand().range([0, width]).padding(0.5);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);    


    var getCountryColor = d3.scaleOrdinal().domain(countries)
                    .range(d3.schemeSet3);
    // Set the domain for x and y scales
    x.domain(countries);
    // Draw the x axis
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .attr("text-anchor", "start");
    const maxY = d3.max(countries, (country, i) => data[i][championName][attr].abs);
    y.domain([0, maxY]);
    // Draw the y axis
    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Draw bars for each country
    countries.forEach((country, i) => {
        chart.selectAll(".bar-" + country.toLowerCase())
            .data([data[i][championName][attr]])
            .enter().append("rect")
            .on("click", function (d) {
                // Handle click event on the bar
                handleBarClick(country);
            })
            .transition()
            .duration(ctx.transitiontTime)
            .attr("class", "bar-" + country.toLowerCase())
            .attr("x", x(country))
            .attr("y", d => y(d.abs))
            .attr("height", d => height - y(d.abs))
            .attr("width", x.bandwidth())
            .attr("fill", getCountryColor(country));
    });
}

function updateData()
{
    const championName = d3.select("#input-box").property("value");
    const attr = d3.select("#input-attr").property("value");

    const urlCountries = ctx.selectedCountries.map(country => regionMap[country]);
    console.log(urlCountries);
    const promises = urlCountries.map(countryCode => {
        const url = `data/formatedstats_${countryCode}_challenger.json`;
        return d3.json(url);
    }); 

    Promise.all(promises).then(function (data) {
        createBarPlot(data, championName, attr, ctx.selectedCountries);
    });
}

function addCountry(country) {
    ctx.selectedCountries.push(country);
    updateData();
}

//Delete a bar of a country which we clicks twice on
function handleBarClick(country) {
    const now = new Date().getTime();
    if (handleBarClick.lastClickTime && now - handleBarClick.lastClickTime < 300) {
        // If the time between two clicks is less than 300 milliseconds, remove the country
        deleteCountry(country);
    }
    handleBarClick.lastClickTime = now;
}

// Function to delete a country
function deleteCountry(country) {
    const index = ctx.selectedCountries.indexOf(country);
    if (index !== -1) {
        ctx.selectedCountries.splice(index, 1);
        updateData();
    }
}
function updateChampionPic(){
    var svg = d3.select("#controls").select("svg");

    var champion = d3.select("#input-box").property("value");
  
    // remove previous pic
    d3.select("#champion-pic").remove();

    // add picture
    svg.append("image") 
      .attr("id", "champion-pic")
      .attr("xlink:href", `https://ddragon.leagueoflegends.com/cdn/13.22.1/img/champion/${champion}.png`)
      .attr("width", 100)
      .attr("height", 100);

}

function initInputBox(){
    Promise.all([d3.json("data/championlist.json")]).then(function(data){
        //Champions à choisir
        // html block
        const controls = d3.select("#controls").style("display", "flex");
        const inputContainer = controls.append("div")
            .attr("class", "input-container")
            .style("flex", "0.4");

        inputContainer.append("p")
        .append("label") // append label
            .text("Select a champion: ")
        .append("input") // append input
            .attr("id", "input-box")
            .attr("type", "text")
            .attr("list", "options-list")
        .append("datalist") //append datalist
            .attr("id", "options-list")

        d3.select("#options-list")
            .selectAll("option")
            .data(data[0])
            .enter()
            .append("option")
            .attr("value", d => d);

        //attributs à choisir
        inputContainer.append("p")
            .append("label") // append label
                .text("Select an attribute: ")
            .append("input") // append input
                .attr("id", "input-attr")
                .attr("type", "text")
                .attr("list", "attributs-list")
            .append("datalist") //append datalist
                .attr("id", "attributs-list") 
        d3.select("#attributs-list")
                .selectAll("option")
                .data(ctx.Attributes)
                .enter()
                .append("option")
                .attr("value", d => d);

        inputContainer.append("p")
                .append("label") // append label
                    .text("Add a country: ")
                .append("input") // append input
                    .attr("id", "input-country")
                    .attr("type", "text")
                    .attr("list", "country-list")
                .append("datalist") //append datalist
                    .attr("id", "country-list") 
            console.log(Object.keys(regionMap))
        d3.select("#country-list")
                    .selectAll("option")
                    .data(Object.keys(regionMap))
                    .enter()
                    .append("option")
                    .attr("value", d => d);

        // add svg for picture
        const imageContainer = controls.append("div")
            .attr("class", "image-container")
            .style("margin-left", "20px");

        imageContainer.append("svg")
            .attr("width", 100)
            .attr("height", 100);
        const box = d3.select("#input-box");
        const attrBox = d3.select("#input-attr");
        const countryBox = d3.select("#input-country");

        box.on("input", checkAndBarPlot);
        attrBox.on("input", checkAndBarPlot);
        countryBox.on("input", checkAndBarPlot);

        function checkAndBarPlot() {
            const boxValue = box.node().value;
            const attrValue = attrBox.node().value;
            const countryValue = countryBox.node().value;
            //add a bar for a chosen country
            if (Object.keys(regionMap).includes(countryValue)) addCountry(countryValue);

            if (data[0].includes(boxValue) && ctx.Attributes.includes(attrValue)) {
                updateChampionPic();
                updateData();//updateBarPlot();
            }
        }
    });
}

function createViz(){
    const mainDiv = d3.select("#main");
    mainDiv.append("g")
        .attr("id", "controls");
    const svg = mainDiv.append("svg")
        .attr("width", ctx.width + ctx.margin.left + ctx.margin.right + 500)
        .attr("height", ctx.height + ctx.margin.top + ctx.margin.bottom + 100)
        .append("g")
    .attr("id", "svg")
        .attr("transform", `translate(${ctx.margin.left},${ctx.margin.top})`);
    initInputBox();

    mainDiv.append("div")
        .attr("class", "footnote")
        .html("If you want to delete a bar, click on it twice");
}
