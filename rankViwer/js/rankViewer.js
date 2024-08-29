let presentWords = {};

const addHandler = () => {
    let wordline = document.getElementById('word-adder').value;
    let color = document.getElementById('color-choice').value;
    let words = wordline.split(' ');

    if (words.length > 0 && color) {
        words.forEach(word => {
            presentWords[word] = color;
        });
        displayWords();
        topicWordPlot();
    }
}

const removeHandler = (word) => {
    if (presentWords.hasOwnProperty(word)) {
        delete presentWords[word];
        displayWords();
        topicWordPlot();
    }
}

document.getElementById('data-select').addEventListener('change',()=>{
    topicWordPlot()
})

const displayWords = () => {
    let html = Object.keys(presentWords).map(word =>
        `<p class="word" style="border-color: ${presentWords[word]};">${word} <button onclick="removeHandler('${word}')">x</button></p>`
    ).join('');
    document.getElementById('word-container').innerHTML = html;
}

let topicWordData = {};
const topicWordPlot = () => {
    let dataVal = document.getElementById('data-select').value
    let dataPath = '';
    switch (dataVal) {
        case 'shake50':
            dataPath = '/data/shake50_word_topic_distribution.csv'
            break;
        case 'moviereview':
            dataPath = '/data/moviereview_word_topic_distribution.csv'
            break;
        default:
            dataPath = '/data/moviereview_word_topic_distribution.csv';
    }
    d3.csv(dataPath).then((data) => {
        let allTopics = data.columns.filter(d => d !== 'word');

        topicWordData = {};
        data.forEach(d => {
            for (let key in d) {
                if (key !== 'word' && parseFloat(d[key]) > 0) {
                    if (!topicWordData[key]) {
                        topicWordData[key] = {};
                    }
                    topicWordData[key][d['word']] = parseFloat(d[key]);
                }
            }
        });

        let svg = d3.select("#topic-word-view").select("svg");
        if (svg.empty()) {
            svg = d3.select("#topic-word-view").append("svg");
        }
        svg.selectAll("*").remove();

        let margin = {top: 20, right: 30, bottom: 50, left: 30},
            width = 750 - margin.left - margin.right,
            height = 550 - margin.top - margin.bottom;

        svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        let g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

        let x = d3.scaleBand()
            .domain(allTopics) 
            .range([0, width])
            .padding(0.1);

        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text") 
            .style("text-anchor", "end")  
            .attr("dx", "-1em")  
            .attr("dy", "-0.5em") 
            .attr("transform", "rotate(-90)");

        let maxTotalScore = d3.max(Object.values(topicWordData), topic => 
            d3.sum(Object.values(topic)));

        let y = d3.scaleLinear()
            .domain([0, maxTotalScore])
            .range([height, 0]);

        g.append("g")
            .call(d3.axisLeft(y));

        Object.keys(topicWordData).forEach(topic => {
            let totalScore = d3.sum(Object.values(topicWordData[topic]));
            g.append("rect")
                .attr("x", x(topic))
                .attr("y", y(totalScore))
                .attr("width", x.bandwidth())
                .attr("height", height - y(totalScore))
                .attr("fill", "rgb(169, 169, 169)")
                .attr("cursor", "pointer")
                .on("click", () => plotWordDistribution(topicWordData[topic], topic));
        });

        Object.keys(topicWordData).forEach(topic => {
            let words = Object.keys(topicWordData[topic]);
            let totalScore = d3.sum(Object.values(topicWordData[topic]));
            let barHeight = height - y(totalScore);
        
            words.sort((a, b) => topicWordData[topic][b] - topicWordData[topic][a]);
        
            words.forEach((word, index) => {
                if (presentWords[word]) {
                    let yPos = y(totalScore) + (index * (barHeight / words.length));

                    g.append("line")
                        .style("stroke", presentWords[word])
                        .attr("x1", x(topic))
                        .attr("x2", x(topic) + x.bandwidth())
                        .attr("y1", yPos)
                        .attr("y2", yPos)
                        .attr("stroke-width", 3);
                }
            });
        });
        
    }).catch(e => {
        console.error('Error loading or processing data:', e);
    });
}



function plotWordDistribution(wordData, topic) {
    document.getElementById('word-topic-view').innerHTML = `<h4 id="topic-head">${topic}</h4>`
    let dataArray = Object.entries(wordData).map(([word, value]) => ({ word, value }));
    
    dataArray.sort((a, b) => b.value - a.value);

    let distributionSVG = d3.select("#word-topic-view").select("svg");
    if (distributionSVG.empty()) {
        distributionSVG = d3.select("#word-topic-view").append("svg");
    }
    distributionSVG.selectAll("*").remove(); 

    let margin = {top: 10, right: 20, bottom: 30, left: 60}, 
        width = 500 - margin.left - margin.right,
        height = dataArray.length * 20; 

    distributionSVG.attr("width", width + margin.left + margin.right)
                   .attr("height", height + margin.top + margin.bottom);

    let g = distributionSVG.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    let y = d3.scaleBand()
        .range([0, height])
        .padding(0.2)
        .domain(dataArray.map(d => d.word)); 

    let x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(dataArray, d => d.value)]); 

    g.append("g")
     .call(d3.axisLeft(y));

    g.selectAll(".bar")
     .data(dataArray)
     .enter().append("rect")
     .attr("class", "bar")
     .attr("y", d => y(d.word))
     .attr("height", y.bandwidth())
     .attr("x", 0)
     .attr("width", d => x(d.value))
     .attr("fill", "rgb(230, 143, 143)")
     .attr('stroke', 'black')
     .attr('stroke-width','1px');
}

topicWordPlot()