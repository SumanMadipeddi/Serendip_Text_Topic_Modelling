document.addEventListener("DOMContentLoaded", function() {
    renderMatrix();
});

// Function to show or hide the loading indicator
function showLoading(visible) {
    d3.select("#loading").style("display", visible ? "block" : "none");
}

function showDetailsLoading(visible) {
    d3.select("#details-loading").style("display", visible ? "block" : "none");
}



function renderMatrix() {

    var selectElement = document.getElementById('matrix-options');
    var selectedValue = selectElement.value;


    const width = 1200;
    const height = selectedValue == "shake50_doc_topic_distribution"? 800 : 40000;
    const margin = { top: 90, right: 10, bottom: 10, left: 170 };
    d3.select("#matrix").selectAll("*").remove();
    d3.select("#word-distribution").selectAll("*").remove();
    const svg = d3.select("#matrix")
                  .attr("width", width)
                  .attr("height", height);
    // Start by showing the loading indicator
    showLoading(true);
    d3.csv("data/"+ selectedValue +".csv").then(data => {
        showLoading(false);
        const topics = data.columns.slice(1); // Exclude the first column (document names)
        console.log(data);
        const matrixSize = topics.length;

        const radiusScale = d3.scaleLinear()
                              .domain([0, 1]) // Assume values are normalized (0 to 1)
                              .range([0, 20]); // Maximum circle radius

        const colorScale = d3.scaleOrdinal(d3.schemePaired) // Provides a color for each topic
                             .domain(topics);

        const xScale = d3.scaleBand()
                         .domain(topics)
                         .range([margin.left, width - margin.right])
                         .padding(0.1);

        const yScale = d3.scaleBand()
                         .domain(data.map(d => d["file"])) // Assuming 'Document' is the identifier column
                         .range([margin.top, height - margin.bottom])
                         .padding(0.1);

        // Draw grid lines
        svg.append("g")
           .attr("class", "grid")
           .selectAll("line.vertical")
           .data(topics)
           .enter().append("line")
           .attr("x1", d => xScale(d) + xScale.bandwidth() / 2)
           .attr("x2", d => xScale(d) + xScale.bandwidth() / 2)
           .attr("y1", margin.top)
           .attr("y2", height - margin.bottom)
           .style("stroke", "black");

        svg.select(".grid")
           .selectAll("line.horizontal")
           .data(data)
           .enter().append("line")
           .attr("y1", d => yScale(d["file"]) + yScale.bandwidth() / 2)
           .attr("y2", d => yScale(d["file"]) + yScale.bandwidth() / 2)
           .attr("x1", margin.left)
           .attr("x2", width - margin.right)
           .style("stroke", "black");

        // Select the tooltip
        const tooltip = d3.select("#tooltip");

        data.forEach(row => {
            topics.forEach(topic => {
                svg.append("circle")
                    .attr("cx", xScale(topic) + xScale.bandwidth() / 2)
                    .attr("cy", yScale(row["file"]) + yScale.bandwidth() / 2)
                    .attr("r", radiusScale(row[topic]))
                    .attr("fill", colorScale(topic))
                    .style("stroke", "black")
                    .on("click", function(event, d) {
                        // Assuming 'd' contains topic and file identifier
                        onCircleClick(topic, row["file"], colorScale(topic));
                    })
                    .on("mouseover", function(event, d) {
                        // Highlight corresponding labels
                        d3.selectAll(`.topic-${topic.replace(/\s+/g, '-')}`).classed("highlight", true);
                        d3.selectAll(`.file-${row["file"].slice(0, -4).replace(/[\s'"]+/g, '-')}`).classed("highlight", true);

                        // Show tooltip
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`Topic: ${topic}<br/>Value: ${row[topic]}<br/>File: ${row["file"]}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function(d) {
                        // Remove highlight from labels
                        d3.selectAll(`.topic-${topic.replace(/\s+/g, '-')}`).classed("highlight", false);
                        d3.selectAll(`.file-${row.file.slice(0, -4).replace(/[\s'"]+/g, '-')}`).classed("highlight", false);

                        // Hide tooltip
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
            });
        });



        // Adding classes to topic labels
        svg.append("g")
        .attr("class", "x-labels")
        .selectAll(".x-label")
        .data(topics)
        .enter().append("text")
        .attr("class", d => `x-label topic-${d.replace(/\s+/g, '-')}`)
        .attr("x", d => xScale(d) + xScale.bandwidth() / 2)
        .attr("y", margin.top - 10)
        .text(d => d)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .attr("transform", d => `translate(20,-20) rotate(-45, ${xScale(d) + xScale.bandwidth() / 2}, ${margin.top - 10})`);

        // Adding classes to filename labels
        svg.append("g")
        .attr("class", "y-labels")
        .selectAll(".y-label")
        .data(data)
        .enter().append("text")
        .attr("class", d => `y-label file-${d["file"].slice(0, -4).replace(/[\s'"]+/g, '-')}`)
        .attr("y", d => yScale(d["file"]) + yScale.bandwidth() / 2)
        .attr("x", margin.left - 10)
        .text(d => d["file"])
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .style("cursor", "pointer")
        .on("click", function(d) {
            // Extract filename and prepare URL
            var filename = d["file"];
            var redirectURL = "textViewer/index.html?dataset=";
            if( selectedValue == "shake50_doc_topic_distribution") {
                redirectURL += "Shakesphere"
            } else {
                redirectURL += "Movies"
            }
    
            // Redirect to the specified URL
            window.location.href = redirectURL;
        });

    });
}

function onCircleClick(topic, text, color) {
    d3.select("#word-distribution").selectAll("*").remove();
    console.log("========")
    var selectElement = document.getElementById('matrix-options');
    var selectedValue = selectElement.value;
    var file;
    if(selectedValue == "shake50_doc_topic_distribution") {
        file = "shake50_word_topic_distribution";
    } else {
        file = "moviereview_word_topic_distribution";
    }
    showDetailsLoading(true);
    // Read the distribution data for the selected topic and file
    d3.csv("data/"+ file +".csv").then(data => {
      // Filter or process data as needed
      let wordsData = processDistributionData(data, topic);
      // Render the bar chart with the processed data
      renderBarChart(wordsData, color);
    });
}

function processDistributionData(data, topic) {
    let wordsData = data.map(d => {
        return { word: d.word, value: +d[topic] }; // Assuming the first column is named 'word'
      });
    
      // Filter out entries with zero values
      wordsData = wordsData.filter(d => d.value > 0);
    
      // Sort the data in descending order by value
      wordsData.sort((a, b) => b.value - a.value);
      return wordsData;
      
}

function renderBarChart(data, color) {
    // Define dimensions and scales
    const barHeight = 5; // Height for each bar
    const barPadding = 5; // Space between bars
    const margin = { top: 60, right: 20, bottom: 30, left: 80 };
    const width = 550 - margin.left - margin.right;
    const height = data.length * (barHeight + barPadding);
    
    // Create the yScale
    const yScale = d3.scaleBand()
      .range([0, height])
      .padding(0.1)
      .domain(data.map(d => d.word)); // The domain is the set of words
  
    // Create the xScale
    const xScale = d3.scaleLinear()
      .range([0, width])
      .domain([0, d3.max(data, d => d.value)]); // The domain goes from 0 to the max value
  
      showDetailsLoading(false);
    // Select the SVG element and clear any existing content
    const svg = d3.select("#word-distribution")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");
  
    // Create the bars
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("width", d => xScale(d.value))
      .attr("y", d => yScale(d.word))
      .attr("height", yScale.bandwidth())
      .attr("fill", color);
  
    // Add the x-axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xScale));
  
    // Add the y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale));
  }
  