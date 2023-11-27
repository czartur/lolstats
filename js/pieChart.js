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

function createBarPlot(data, championName) {
    const svg = d3.select("#svg");
    
    const margin = { top: 20, right: 20, bottom: 30, left: 20 };
    const width = 400 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const chartWidth = width / 3;
    const chartMargin = 100;

    const values = ['popularity', 'win', 'ban']
    const labels = ['Popularity', 'WinRate', 'BanRate'];

    const c = d3.scaleOrdinal()
                .domain(values)
                .range(["#008CBA", "green", "red"]);
    for (let i = 0; i < 3; i++) 
    {
        const g = svg.append("g")
            .attr("transform", `translate(${i * (chartWidth + chartMargin) + chartMargin}, ${height / 2})`);

            var arc = d3.arc()
                        .innerRadius(80)
                        .outerRadius(100)
                        .cornerRadius(20);
            var RateValue = data[championName][values[i]].abs;
            var data_attr = [RateValue, (1 - RateValue)];


            g.append("text")
                        .attr("text-anchor", "middle")
                        //.attr("dy", ".3em")
                        .style("font-size", "32px") 
                        .style("fill", c(values[i]))
                        .text(`${(RateValue * 100).toFixed(1)}%`);

            var colorScale = d3.scaleOrdinal()
                    .domain([0, 1])
                    .range([c(values[i]), "grey"]);

            var pie = d3.pie()
                        .sort(null)
                        .value(function(d) {
                            return d;
                        });

            g.selectAll(".arc")
                .data(pie(data_attr))
                .enter()
                .append("path")
                .attr("class", "arc")
                .style("fill", function(d) {
                    return colorScale(d.value);
                })
                .attr("d", arc)

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "2em") // Adjust the vertical position as needed
                .style("font-size", "16px")
                .style("fill", c(values[i]))
                .text(`${labels[i]}`);
    }
}

function updateData()
{
    const championName = d3.select("#input-box").property("value");
    const countryName = d3.select("#input-country").property("value");
    const urlCountry = regionMap[countryName];

    console.log(urlCountry)
    Promise.all([d3.json(`data/stats/stats_${urlCountry}_challenger.json`)]).then(function (data) {
        createBarPlot(data[0], championName);
    });
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

        inputContainer.append("p")
                .append("label") // append label
                    .text("Add a country: ")
                .append("input") // append input
                    .attr("id", "input-country")
                    .attr("type", "text")
                    .attr("list", "country-list")
                .append("datalist") //append datalist
                    .attr("id", "country-list") 
          //  console.log(Object.keys(regionMap))
        d3.select("#country-list")
                    .selectAll("option")
                    .data(Object.keys(regionMap))
                    .enter()
                    .append("option")
                    .attr("value", d => d);

        // add svg for picture
        const imageContainer = inputContainer.append("p");

        imageContainer.append("svg")
            .attr("width", 100)
            .attr("height", 100);
        const box = d3.select("#input-box");
        const countryBox = d3.select("#input-country");

        box.on("input", checkAndBarPlot);
        countryBox.on("input", checkAndBarPlot);

        function checkAndBarPlot() {
            const boxValue = box.property("value");
            const countryValue = countryBox.property("value");
            //add a bar for a chosen country
            if (Object.keys(regionMap).includes(countryValue) && data[0].includes(boxValue)) {
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
}