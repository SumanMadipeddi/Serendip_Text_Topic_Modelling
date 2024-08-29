let g_topic_csv;
let g_topic_json;
let g_word_csv;

let g_topic_list;
let curr_text;
let updated_text;
let modifiedList;

const highlightedWords = new Set();

const rectangleStates = {};

const color = d3.scaleOrdinal(d3.schemeCategory10);

// Function to get URL parameters
function getUrlParams() {
  var params = {};
  var urlParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlParams.entries()) {
      params[key] = value;
  }
  return params;
}

// Get URL parameters
var urlParams = getUrlParams();

async function loadTopicCsv(dataset) {

  if(dataset != 'Movies') {
      await d3.csv('shake50_doc_topic_distribution.csv')
      .then(function(data) {
        // console.log(data);
        g_topic_csv = data;
        
      })
      .catch(function(error) {
        console.error('Error loading JSON file:', error);
      });

      showDocument(dataset, 'TamingoftheShrew.txt');
      drawCharts('TamingoftheShrew.txt');
  } else if(dataset == 'Movies') {
    await d3.csv('moviereview_doc_topic_distribution.csv')
    .then(function(data) {
      // console.log(data);
      g_topic_csv = data;
      
    })
    .catch(function(error) {
      console.error('Error loading JSON file:', error);
    });

    showDocument(dataset, '699_0.txt');
    drawCharts('699_0.txt');
  }
}

function findObjectByFile(arr, fileString) {
  return arr.find(obj => obj.file === fileString);
}

document.addEventListener('DOMContentLoaded', function () {
    var dataset = urlParams['dataset']
    loadTopicCsv(dataset);
    loadWordDensities(dataset);
});

function drawCharts(fileName) {
  let working_obj = findObjectByFile(g_topic_csv, fileName)
  // console.log(working_obj);

  Object.keys(working_obj).forEach(function(key) {
    const isQuantitative = !isNaN(parseFloat(working_obj[key]));
    if(isQuantitative) {
        working_obj[key] = +working_obj[key];
    }
    else {
        working_obj[key].replace(/\W/g, '');
    }
  });

  // console.log(working_obj);

  const entries = Object.entries(working_obj);

  const filteredEntries = entries.filter(([key, value]) => {
    if (key === "file") return false;
    return value >= 0.001;
  });

  const sortedEntries = filteredEntries.sort((a, b) => b[1] - a[1]);

  const prominentTopics = sortedEntries.slice(0, 5);

  // console.log("Prominent Topics:");

  let scorelist = []
  let topiclist = []

  let maxScore = -Infinity;
  prominentTopics.forEach(([topic, score]) => {
    // console.log(`${topic}: ${score}`);
    if(score > maxScore) {
      maxScore = score;
    }
    topiclist.push(topic);
    scorelist.push(score);
  });

  // console.log(maxScore);

  g_topic_list = topiclist;
  color.domain(g_topic_list)

  drawTiles(prominentTopics, topiclist, scorelist, maxScore);

}

function drawTiles(prominentTopics, topiclist, scorelist, maxScore) {
    
    width=300;
    height=50;

    const x = d3.scaleLinear()
    .domain([0, maxScore])
    .range([ 0, width]);

    const y = d3.scaleBand()
    .range([ 0, height ])

    // console.log(prominentTopics);

    const topicDivs = d3.selectAll("div[id^='topicdiv']");
    
    // console.log(topicDivs)

    let list_of_tdivs = ['topicdiv1', 'topicdiv2', 'topicdiv3', 'topicdiv4', 'topicdiv5']
    let list_of_topics = topiclist;

    list_of_tdivs.forEach((tdiv, i) => {
      // console.log(i);
      const container = document.getElementById(tdiv);
      
      const rectangle = document.createElement('div');
      rectangle.style.backgroundColor = 'white';
      rectangle.style.height = '45px';
      rectangle.style.width = `${x(scorelist[i])}px`;
      rectangle.style.display = 'inline-block';
      rectangle.className = 'recttag';
      rectangle.id = 'recttag'+(i+1);
      rectangle.style.marginTop = '3px';
      rectangle.addEventListener('click', handleRectangleClick);      
      rectangleStates['recttag'+(i+1)] = 'white';
      
      const textElement = document.createElement('span');
      textElement.textContent = list_of_topics[i];
      textElement.style.color = 'black';
      textElement.style.top = '50%';
      textElement.style.left = '50%';
      textElement.style.fontSize = '10px';
      textElement.style.fontWeight = 'bold';

      rectangle.appendChild(textElement);
      container.appendChild(rectangle);
    })

}

function findMinMax(data) {
    let min = Infinity;
    let max = -Infinity;
  
    for (const obj of data) {
      for (const topic in obj) {
        const value = obj[topic];
        if (value < min) {
          min = value;
        }
        if (value > max) {
          max = value;
        }
      }
    }
  
    return { min, max };
}

function calculateTopicDensity(text, topicWordsTempDict) {
    const paragraphs = text;
  
    const topicDensities = [];
  
    for (const paragraph of paragraphs) {
      const words = paragraph.toLowerCase().match(/\w+/g);
      const totalWords = words.length;
  
      const topicWordCounts = {};
      for (const topic in topicWordsTempDict) {
        topicWordCounts[topic] = 0;
        for (const word of words) {
          if (topicWordsTempDict[topic].includes(word)) {
            topicWordCounts[topic]++;
          }
        }
      }
      const paragraphTopicDensities = {};
      for (const topic in topicWordCounts) {
        paragraphTopicDensities[topic] = topicWordCounts[topic] / totalWords;
      }
  
      topicDensities.push(paragraphTopicDensities);
    }
  
    return topicDensities;
}

function handleRectangleClick(event) {
  const clickedRectangle = event.target;
  const rectangleId = clickedRectangle.id;

  // console.log(rectangleId);
  const match = rectangleId.match(/\d+/);
  const number = match ? parseInt(match[0]) : null;
  // console.log(number);
  // console.log(g_topic_list[number-1])
  if (rectangleStates[rectangleId] === 'white') {
    clickedRectangle.style.backgroundColor = color(g_topic_list[number-1]);
    rectangleStates[rectangleId] = color(g_topic_list[number-1]);
    updateDocument(g_topic_list[number-1], 1);
    d3.selectAll("."+g_topic_list[number-1].replace(' ', ''))
                  .attr("stroke", color(g_topic_list[number-1]))
                  .attr("stroke-width", 3.5);
  } else {
    clickedRectangle.style.backgroundColor = 'White';
    rectangleStates[rectangleId] = 'White';
    for (const word of g_word_csv[g_topic_list[number-1]]) {
      if (highlightedWords.has(word)) {
        highlightedWords.delete(word);
      }
    }
    updateDocument(g_topic_list[number-1], 0);
    d3.selectAll("."+g_topic_list[number-1].replace(' ', ''))
                  .attr("stroke", 'grey')
                  .attr("stroke-width", 2);
  }

  // console.log(g_topic_list[number-1].replace(' ', ''))
  

}


function scrollToWord(textarea, word) {
  const textareaElement = document.getElementById(textarea);

  const textContent = textareaElement.value;

  const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
  const match = wordRegex.exec(textContent);
  const wordIndex = match ? match.index : -1;

  if (wordIndex === -1) {
    return;
  }

  const rows = textContent.substr(0, wordIndex).split('\n');
  const row = rows.length;
  const col = rows[rows.length - 1].length;

  const startPos = wordIndex;
  const endPos = wordIndex + word.length;
  textareaElement.setSelectionRange(startPos, endPos);

  textareaElement.focus();
  textareaElement.scrollTop = textareaElement.scrollHeight;
}

function getFirstTwoWords(paragraph) {
  const words = paragraph.trim().split(/\s+/);

  return words.slice(0, 1);
}

function scrollToParagraph(section) {
    const textarea = document.getElementById('wordbox');

    const paragraph = modifiedList[section - 1];

    console.log(paragraph);

    console.log(getFirstTwoWords(paragraph));
    scrollToWord('wordbox', getFirstTwoWords(paragraph));
}

function drawLineChart(dataset, full_text, paragraph_args) {
    
    let n_sections = paragraph_args.length;

    const topicDensities = calculateTopicDensity(paragraph_args, g_word_csv);

    const { min, max } = findMinMax(topicDensities);
    console.log("Minimum value:", min);
    console.log("Maximum value:", max);

    let x, width, height, svg;
    if(dataset != 'Movies') {
      width = 330;
      height = 25000;
      svg = d3.select("#linechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
      
        x = d3.scaleLinear()
        .range([0, width])
                    .domain([-1,2]);
    } else {
      width = 330;
      height = 700;
      svg = d3.select("#linechart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)

        x = d3.scaleLinear()
        .range([0, width])
                    .domain([-0.25,1]);
    }
    
    
    svg.append("g")
        .attr('class', 'xaxis')
        .attr("transform", `translate(0, ${height} )`)
        .call(d3.axisBottom(x));

    const y = d3.scaleLinear()
                .range([height, 0])
                .domain([height, 0]);
    
    svg.append("g")
        .attr('class', 'yaxis')
        .call(d3.axisLeft(y).ticks(n_sections));

    const reduced = topicDensities.reduce((acc, obj) => {
        for (const topic in obj) {
            if (!acc[topic]) {
                acc[topic] = [];
            }
            acc[topic].push(+obj[topic].toFixed(3));
        }
        return acc;
    }, {});
    
    // console.log(reduced);
    
    sectionHeight = height/n_sections;
    let rowHeight = sectionHeight
    
    const rows = svg.selectAll('rect')
            .data(d3.range(n_sections))
            .enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', (d, i) => i * rowHeight)
            .attr('width', width)
            .attr('height', rowHeight)
            .attr('fill', 'transparent')
            .on('click', (event, d) => {
                const section = d + 1;
                console.log(`Click occurred in section ${section}`);
                event.target.style.backgroundColor = 'black';
                scrollToParagraph(section);
            });

    const line = d3.line()
        .curve(d3.curveBasis);

    Object.keys(reduced).forEach((topic, i) => {
        const data = reduced[topic];
        let prevX = 0;
        let prevY = 0;

        // console.log(topic)
    
        data.forEach((value, index) => {
            const x1 = x(value);
            const y1 = y((index+1) * sectionHeight);

            let classattr = topic.replace(' ', '')

            svg.append("path")
            .attr("d", line([[x1, y1], [prevX, prevY]]))
            .attr("fill", "none")
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
            .attr("class", classattr);
        
            prevX = x1;
            prevY = y1;
        });
    });

}

function highlightWords(text, wordsObject, key) {
  
  // console.log(wordsObject, key);

  const words = wordsObject[key];

  // console.log(words)

  const reducedWordList = words.filter(word => !highlightedWords.has(word));

  reducedWordList.forEach(word => {
    highlightedWords.add(word)
  })
  // console.log(highlightedWords);

  console.log(reducedWordList);
  if(reducedWordList.length <1) {
    return text;
  }

  // Replace the matched words with the <mark> tag
  for (let i = 0; i < reducedWordList.length; i++) {
      let word = reducedWordList[i];
      let regex = new RegExp("(?!<[^>]*>)\\b" + word + "\\b(?![^<]*>)", "g");
      text = text.replace(regex, `<mark class="${key.replace(' ', '')}" style="background-color: ${color(key)};">` + word + "</mark>");
  }

  return text;

  // const wordsRegex = new RegExp(`\\b(${reducedWordList.join('|')})\\b`, 'gi');

  // return text.replace(wordsRegex, match => `<mark class="${key.replace(' ', '')}" style="background-color: ${color(key)};">${match}</mark>`);
}

function splitTextIntoParts(text, wordsPerPart = 15) {
  const words = text.split(' ');

  const parts = [];

  for (let i = 0; i < words.length; i += wordsPerPart) {
    const part = words.slice(i, i + wordsPerPart).join(' ');
    parts.push(part);
  }

  return parts;
}

function removeMarkTags(containerElement, markClassName) {
  const markElements = containerElement.getElementsByClassName(markClassName);
  const marksArray = Array.from(markElements);

  marksArray.forEach(mark => {
    const textContent = mark.textContent;
    const textNode = document.createTextNode(textContent);
    mark.replaceWith(textNode);
  });
}

function updateDocument(topic, colorbool) {
    curr_text = $('.highlights').html();
    console.log(curr_text)
    
    if(colorbool) {
      updated_text = highlightWords(curr_text, g_word_csv, topic);
      $('.highlights').html(updated_text);
    } else {
      const container = document.getElementById('overlaydiv');
      removeMarkTags(container, topic.replace(' ', ''));
    }
}

async function showDocument(dataset, txt) {

  let get_text;

  // console.log('texting')

  fetch(txt)
    .then(function (res) {
        return res.text();
    })
    .then(function (data) {
        // console.log('Inside')
        get_text = data;

        $('#wordbox').html(get_text)
        $('.highlights').html(get_text);

        if(dataset != "Movies") {
            const paragraphs = get_text.split('\r\r\n\r\r\n\t');

            console.log(`The composition has ${paragraphs.length} paragraphs.`);

            function replacePattern(stringList, pattern) {
              return stringList.map(str => str.replaceAll(pattern, ' '));
            }

            modifiedList = replacePattern(paragraphs, '\r\r\n\t');

            drawLineChart(dataset, get_text,modifiedList)
        } else {
            modifiedList = splitTextIntoParts(get_text);
            drawLineChart(dataset, get_text,modifiedList)
        }

  });
    
}

function handleInput() {
    var text = $('#wordbox').val();
    $('.highlights').html(text);
}

function handleScroll() {
    var scrollTop = $('#wordbox').scrollTop();
    $('.highlights').scrollTop(scrollTop);
}

async function loadWordDensities(dataset) {

  if(dataset != 'Movies') {
   await d3.csv('shake50_word_topic_distribution.csv')
   .then(function(data) {
    const topicWords = {};

    data.forEach(item => {
      for (let i = 1; i <= 50; i++) {
        const topicKey = `Topic ${i}`;
        if (item[topicKey] !== '0.0') {
          if (!topicWords[topicKey]) {
            topicWords[topicKey] = [];
          }
          topicWords[topicKey].push(item.word);
        }
      }
    });

    // console.log(topicWords);


     g_word_csv = topicWords;
   })
   .catch(function(error) {
     console.error('Error loading JSON file:', error);
   });
  } else if(dataset == 'Movies')
  {
   await d3.csv('moviereview_word_topic_distribution.csv')
   .then(function(data) {
    const topicWords = {};

    data.forEach(item => {
      for (let i = 1; i <= 50; i++) {
        const topicKey = `Topic ${i}`;
        if (item[topicKey] !== '0.0') {
          if (!topicWords[topicKey]) {
            topicWords[topicKey] = [];
          }
          topicWords[topicKey].push(item.word);
        }
      }
    });

    console.log(topicWords);
     g_word_csv = topicWords;
   })
   .catch(function(error) {
     console.error('Error loading JSON file:', error);
   });
  }
}
