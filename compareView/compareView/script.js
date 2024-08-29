const svg = d3.select("#vennDiagram");
let articles;

addDatasets();
eventListeners();

function addDatasets() {
    const datasets = ["shake50_top_topic_word_data.csv", "moviereview_top_topic_word_data.csv"];
    const dataDropdown = d3.select("#dataset");

    dataDropdown.selectAll("option")
        .data(datasets)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    dataDropdown.on("change", function() {
        loadDataset(this.value);
    });

    if (datasets.length > 0) {
        loadDataset(datasets[0]);
    }
}

function loadDataset(file) {
    d3.csv(file).then(function(data) {
        articles = data;
        addDropdowns(data);
    }).catch(function(error) {
        console.error("Error loading the dataset: ", error);
    });
}

function addDropdowns(data) {
    const dropdown1 = d3.select("#article1").html("");
    const dropdown2 = d3.select("#article2").html("");

    dropdown1.selectAll("option")
        .data(data)
        .enter()
        .append("option")
        .text(d => d.Title)
        .attr("value", d => d.Title);

    dropdown2.selectAll("option")
        .data(data)
        .enter()
        .append("option")
        .text(d => d.Title)
        .attr("value", d => d.Title);
}

function eventListeners() {
    d3.select("#article1").on("change", updateVennDiagram);
    d3.select("#article2").on("change", updateVennDiagram);
}

function updateVennDiagram() {
    const selected1 = articles.find(article => article.Title === d3.select("#article1").property("value"));
    const selected2 = articles.find(article => article.Title === d3.select("#article2").property("value"));
    if (selected1 && selected2) {
        drawVennDiagram(selected1.Topics.split(","), selected2.Topics.split(","), selected1.Title, selected2.Title);
    }
}

function drawVennDiagram(topics1, topics2, title1, title2){
    svg.selectAll("*").remove();
    const tooltip = d3.select("#tooltip");
    const commonTopics = topics1.filter(topic => topics2.includes(topic));
    const leftTopics = topics1.filter(topic => !commonTopics.includes(topic));
    const rightTopics = topics2.filter(topic => !commonTopics.includes(topic));

    console.log("common topics", commonTopics);
    console.log("unique 1 topics", leftTopics);
    console.log("unique 2 topics", rightTopics);

    svg.append("rect")
       .attr("x", 130)
       .attr("y", 20)
       .attr("width", 950)
       .attr("height", 450)
       .attr("stroke", "grey")
       .attr("fill", "none")
       .attr("stroke-width", 2);

    const leftAricle = svg.append("circle")
                               .attr("class", "article")
                               .attr("cx", 500)
                               .attr("cy", 250)
                               .attr("r", 200)
                               .attr("stroke", "black")
                               .attr("fill", "lightblue")
                               .attr("fill-opacity", 0.3);

    const rightArticle = svg.append("circle")
                        .attr("class", "article")
                        .attr("cx", 750)
                        .attr("cy", 250)
                        .attr("r", 200)
                        .attr("stroke", "black")
                        .attr("fill", "pink")
                        .attr("fill-opacity", 0.3);
    
    const legends = svg.append("g")
            .attr("class", "legends")
            .attr("transform", "translate(50, 30)");
 
     legends.append("rect")
            .attr("x", 100)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", "lightblue");
 
     legends.append("text")
            .attr("x", 130)
            .attr("y", 15)
            .text(title1)
            .style("font-size", "15px")
            .attr("alignment-baseline","middle");
 
     legends.append("rect")
            .attr("x", 100)
            .attr("y", 30)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", "pink");
 
     legends.append("text")
            .attr("x", 130)
            .attr("y", 45)
            .text(title2)
            .style("font-size", "15px")
            .attr("alignment-baseline","middle");

    const intersect_pos = calcCirclePos(625, 250, 30, commonTopics.length);
    const commonCircles = svg.selectAll(".intersection-topic")
                            .data(commonTopics)
                            .enter()
                            .append("circle")
                            .attr("class", "intersection-topic")
                            .attr("cx", (d, i) => intersect_pos[i].x)
                            .attr("cy", (d, i) => intersect_pos[i].y)
                            .attr("r", 15)
                            .attr("fill", "lightgreen")
                            .attr("stroke", "black")
                            .on("mouseover", function(event, d) {
                                    tooltip.html(d)
                                        .style("visibility", "visible")
                                        .style("left", (event.pageX + 10) + "px")
                                        .style("top", (event.pageY - 10) + "px");
                                })
                            .on("mouseout", function() {
                                    tooltip.style("visibility", "hidden");
                                });

    const left_pos = calcCirclePos(400, 250, 30, leftTopics.length);
    const left_circles = svg.selectAll(".unique1-topic")
                        .data(leftTopics)
                        .enter()
                        .append("circle")
                        .attr("class", "unique1-topic")
                        .attr("cx", (d, i) => left_pos[i].x)
                        .attr("cy", (d, i) => left_pos[i].y)
                        .attr("r", 15)
                        .attr("fill", "yellow")
                        .attr("stroke", "black")
                        .on("mouseover", function(event, d) {
                            tooltip.html(d)
                                .style("visibility", "visible")
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 10) + "px");
                        })
                        .on("mouseout", function() {
                                tooltip.style("visibility", "hidden");
                            });


    const right_pos = calcCirclePos(850, 250, 30, rightTopics.length);
    const right_circles = svg.selectAll(".unique2-topic")
                        .data(rightTopics)
                        .enter()
                        .append("circle")
                        .attr("class", "unique2-topic")
                        .attr("cx", (d, i) => right_pos[i].x)
                        .attr("cy", (d, i) => right_pos[i].y)
                        .attr("r", 15)
                        .attr("fill", "red")
                        .attr("stroke", "black")
                        .on("mouseover", function(event, d) {
                            tooltip.html(d)
                                .style("visibility", "visible")
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 10) + "px");
                        })
                        .on("mouseout", function() {
                                tooltip.style("visibility", "hidden");
                            });

};

function calcCirclePos(cx, cy, baseRadius, count) {
    const positions = [];
    const angleStep = (2 * Math.PI) / count;
    const spacing = 10;
    const effectiveRadius = baseRadius + spacing * Math.sqrt(count);

    for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const x = cx + effectiveRadius * Math.cos(angle);
        const y = cy + effectiveRadius * Math.sin(angle);
        positions.push({ x: x, y: y });
    }
    return positions;
}

