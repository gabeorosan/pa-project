$(document).ready(function() {
    const searchInput = document.getElementById('search-input')
    const searchCapsidButton = document.getElementById('search-capsid-button')
    const openBtn = document.getElementById('openbtn')
    const scatterBtn = document.getElementById('scatter-btn')
    const barBtn = document.getElementById('bar-btn')
    const pieBtn = document.getElementById('pie-btn')
    const heatmapBtn = document.getElementById('heatmap-btn')
    const searchOutput = document.getElementById('search-output')
    const graphContainer = document.getElementById('graph-container')
    const idFilter = document.getElementById('idfilter')
    const fileInput = document.getElementById('input-file')
    const customCont = document.getElementById('custom-cont')
    var units = {'weight': 'Da', 'atoms': '#', 'deposited_polymer_monomer_count': '#',
    'polymer_molecular_weight_maximum': 'Da', 'polymer_molecular_weight_minimum': 'Da',
    'average_radius': 'Da', 'resolution': 'Å'}
    var continuousMetrics; var countContinuousMetrics; var discreteMetrics; var globalData; var filters;
    var margin = {top: 30, right: 30, bottom: 30, left: 60},
        width = vw(95) - 250  - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;
    var dataRef = firebase.database().ref('/data/')
    var propRef = firebase.database().ref('/properties/')
    var filterRef = firebase.database().ref('/filters/')
    var liveGraphs = {'scatter': [], 'bar': [], 'pie': [], 'heatmap': []}

    loadData()
    idFilter.addEventListener('change', filterIds)
    fileInput.addEventListener('change', getFile)
    searchCapsidButton.addEventListener("click", searchCapsid)
    openBtn.addEventListener("click", toggleNav)
    scatterBtn.addEventListener("click", newScatter)
    barBtn.addEventListener("click", newBar)
    pieBtn.addEventListener("click", newPie)
    heatmapBtn.addEventListener("click", newHeatmap)

    const average = arr => sum(arr) / arr.length
    const sum = arr => {var sum=0; var i=arr.length; while(i--) {sum += arr[i]}; return sum}
    function loadData() {
        Promise.all([dataRef.get(), propRef.get(), filterRef.get()]).then((values) => {
            globalData = values[0].val()
            var props = values[1].val()
            continuousMetrics = props['continuous']
            countContinuousMetrics = ['count', ...continuousMetrics]
            discreteMetrics = props['discrete']
            filters = values[2].val()
            document.getElementById('init-container').style.visibility = 'visible' 
            document.getElementById('load').style.display = 'none'
            updateAll()
        })
    }
    function readFileContent(file) {
        const reader = new FileReader()
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result)
            reader.onerror = error => reject(error)
            reader.readAsText(file)
        })
    }
    function getFile(event) {
        const input = event.target
        if ('files' in input && input.files.length > 0) {
            readFileContent(input.files[0]).then(content => {
                var ids = content.split('\n').map(s => s.toLowerCase())
                const asArray = Object.entries(globalData);
                const filtered = asArray.filter(([key, value]) => ids.includes(key.toLowerCase()))
                globalData = Object.fromEntries(filtered);
            })
        }
    }
    function loadFile(filePath) {
        var result = null;
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", filePath, false);
        xmlhttp.send();
        if (xmlhttp.status==200) {
            result = xmlhttp.responseText;
        }
        return result;
    }
    function filterIds() {
        switch(idFilter.value) {
            case 'unique':
                customCont.style.display = 'none'
                var ids = loadFile('unids.txt').split('\n').map(s => s.toLowerCase())
                const filtered = Object.entries(globalData).filter(([key, value]) => ids.includes(key.toLowerCase()))
                globalData = Object.fromEntries(filtered)
                updateAll()
                break;
            case 'all':
                customCont.style.display = 'none'
                loadData()
                break;
            case 'custom':
                loadData()
                customCont.style.display = 'block'
        }
    }
    function updateAll() {
        funcDict = {'scatter': updateScatter, 'pie': updatePie, 'bar': updateBar, 'heatmap': updateHeatmap}
        for (k in liveGraphs){
            var func = funcDict[k]
            for (let i=0; i<liveGraphs[k].length; i++){
               func(liveGraphs[k][i])
            }
        }
    }
    function vw(percent) {
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      return (percent * w) / 100;
    }
    function toggleNav() {
      document.getElementById("mySidebar").classList.toggle('show-sidebar')
      document.getElementById("main").classList.toggle('sidebar-margin')
    }
    function capsidWidget(name, data){
       var widget = document.createElement('div')
       var widgetTitle = document.createElement('h3')
       widgetTitle.innerHTML = name
       widget.appendChild(widgetTitle)
       var d = Object.entries(data)
       for (let i=0;i< d.length;i++){
            let k = d[i][0]
            let v = d[i][1]
            if (typeof v != 'object') {
                var fieldTitle = document.createElement('p')
                fieldTitle.innerHTML = k + ': ' + v
                widget.appendChild(fieldTitle)
            }
       }
       searchOutput.appendChild(widget)
    } 
    function stDev (array) {
        if (!array || array.length === 0) {return 0;}
        const n = array.length
        const mean = array.reduce((a, b) => a + b) / n
        return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
    }
    function searchCapsid(){
        searchOutput.innerHTML = ''
        var virus = globalData[searchInput.value]
        capsidWidget(searchInput.value, virus)
    }
    function filterCount(discrete, filterObj) {
        var res = {}
        var d = Object.values(globalData).filter(e => {return ((discrete in e))})
        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filterObj).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(filterObj[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })

        var classes = filters[discrete]
        for (let i=0;i<classes.length;i++) {
            var classMatch = filtered.filter(e => {return (e[discrete] == classes[i])})
            if (classMatch.length) res[classes[i]] = classMatch.length
        }

        var rkeys = Object.keys(res)
        var colors = createSpectrum(rkeys.length)
        var clist = rkeys.map(e => {
            return [e, colors[rkeys.indexOf(e)]]
        })
        var cdict = {}
        for (var i=0;i<clist.length;i++){
            cdict[clist[i][0]] = clist[i][1]
        }
        return [res, cdict]
    }
    function filterDiscreteObj(discreteObj, continuous, filterObj) {
        var discreteFields = Object.keys(discreteObj)
        var discX = discreteFields[0]
        var discY = discreteFields[1] || discreteFields[0]
        var discreteVals = Object.values(discreteObj)
        var res = []
        var contIsCount = continuous == 'count'
        var d = Object.values(globalData).filter(e => {return ((continuous in e || contIsCount) &&
        (contIsCount || !(isNaN(e[continuous]))))})
        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filterObj).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(filterObj[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })
        var discreteFiltered = filtered.filter(e => {
            var passFilter = true
            Object.keys(discreteObj).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(discreteObj[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })
        if (discreteVals.length == 1) discreteVals.push(discreteVals[0])
        for (let i=0;i<discreteVals[0].length;i++) {
            var x = discreteVals[0][i]
            for (let j=0;j<discreteVals[1].length;j++) {
                var y = discreteVals[1][j]
                var classFilter = discreteFiltered.filter(e => {return ((e[discX] == x) && (e[discY] == y))})
                var classTotal = classFilter.map(e => {return contIsCount ? 1 : e[continuous]})
                var classAvg = contIsCount ?  sum(classTotal) : average(classTotal)
                if (isNaN(classAvg)) classAvg = 0
                res.push([x, y, Math.round(classAvg)])
            }
        }
        return res
    }
    function filterDiscrete(discrete, classes, continuous, filterObj) {
        var res = []
        var contIsCount = continuous == 'count'
        var d = Object.values(globalData).filter(e => {return ((discrete in e) && (continuous in e || contIsCount) &&
        (!(isNaN(e[continuous])) || contIsCount))})

        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filterObj).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(filterObj[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })
        for (let i=0;i<classes.length;i++) {
            var classFilter = filtered.filter(e => {return (e[discrete] == classes[i])})
            var classTotal = classFilter.map(e => {return contIsCount ? 1 : e[continuous]})
            var classAvg = contIsCount ?  sum(classTotal) : average(classTotal)
            if (isNaN(classAvg)) classAvg = 0
            res.push([classes[i], Math.round(classAvg)])
        }
        return [res, filtered.length]
    }
    function hslToRgb(_h, s, l) {
        var h = Math.min(_h, 359)/60;

        var c = (1-Math.abs((2*l)-1))*s;
        var x = c*(1-Math.abs((h % 2)-1));
        var m = l - (0.5*c);

        var r = m, g = m, b = m;

        if (h < 1) {
            r += c, g = +x, b += 0;
        } else if (h < 2) {
            r += x, g += c, b += 0;
        } else if (h < 3) {
            r += 0, g += c, b += x;
        } else if (h < 4) {
            r += 0, g += x, b += c;
        } else if (h < 5) {
            r += x, g += 0, b += c;
        } else if (h < 6) {
            r += c, g += 0, b += x;
        } else {
            r = 0, g = 0, b = 0;
        }

        return 'rgb(' + Math.floor(r*255) + ', ' + Math.floor(g*255) + ', ' + Math.floor(b*255) + ')';
    }

    function createSpectrum(length) {
        var colors = [];
        // 270 because we don't want the spectrum to circle back
        var step = 270/length;
        for (var i = 1; i <= length; i++) {
            var color = hslToRgb((i)*step, 0.5, 0.5);
            colors.push(color);
        }

        return colors;
    }
    function randomProperty(obj) {
        var keys = Object.keys(obj);
        return keys[ keys.length * Math.random() << 0]
    }
    function filterContinuous(metrics, filterObj) {
        var x = metrics[0]
        var y = metrics[1]
        var globId = Object.entries(globalData).map(e => {e[1]['id'] = e[0];return e[1]})
        var d = globId.filter(e => (x in e) &&
        (y in e) && !(isNaN(e[x])) && !(isNaN(e[y])))
        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filterObj).forEach(function(key, index) {
            if (key == 'primary') return true
            if (!(key in e)) passFilter = false
            else if (!(filterObj[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })

        var primary = filterObj.primary
        if (!(primary in (filterObj))) filterObj[primary] = filters[primary]
        var colors = createSpectrum(filterObj[primary].length)
        var clist = filterObj[primary].map(e => {
            return [e, colors[filterObj[primary].indexOf(e)]]
        })
        var cdict = {}
        for (var i=0;i<clist.length;i++){
            cdict[clist[i][0]] = clist[i][1]
        }
        cdict['Missing'] = '#000'
        return [filtered.map(e =>[e[x], e[y], e[primary], e.id]), cdict]
    }
    function save(filename, data) {
        const blob = new Blob(data, {type: 'text/csv'});
        if(window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else{
            const elem = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = filename;        
            document.body.appendChild(elem);
            elem.click();        
            document.body.removeChild(elem);
        }
    }
    function roundLast(x) {
        var res = '1'.padEnd(String(Math.round(x)).length + 1, "0")
        return res
    }
    function unitText(continuous) {
        if (continuous in units) {
            return ` (${units[continuous]})`
        } 
        return ''
    }
    function makeScatter(id, metrics, filterList){
        var d_grouped;
        var [d, colorDict] = filterContinuous(metrics, filterList)
        var xMetric = metrics[0]
        var yMetric = metrics[1]
        var xList = d.map(x => x[0])
        var yList = d.map(y => y[1])
        var xMax = Math.max.apply(null, xList)
        var yMax = Math.max.apply(null, yList)
        var xAve = Math.round(average(xList) * 100) / 100
        var yAve = Math.round(average(yList) * 100) / 100
        var xStdev = Math.round(stDev(xList) * 100) / 100
        var yStdev = Math.round(stDev(yList) * 100) / 100
        var graphEl = document.getElementById(`${id}graph`)
        var svg = d3.select(`#${id}graph`)
                    .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                        .attr("transform",
                              "translate(" + margin.left + "," + margin.top + ")");
        var x = d3.scaleLinear()
                .domain([0, xMax])
                .range([ 0, width ]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));
        var y = d3.scaleLinear()
                .domain([0,yMax])
                .range([ height, 0]);
          var tooltip = d3
        .select(`#${id}graph`)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", 'absolute')
    var mouseover = function (d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "green").style("opacity", 1);
      };
      var mousemove = function (d) {
        tooltip
          .html(`(${d[0]}, ${d[1]}): ${d[3]}`)
          .style("left", d3.mouse(this)[0] + 70 + "px")
          .style("top", d3.mouse(this)[1] + "px");
      };
      var mouseleave = function (d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
      };

        svg.append("g")
            .call(d3.axisLeft(y));
        svg.append('g')
            .selectAll("dot")
            .data(d)
            .enter()
            .append("circle")
              .attr("cx", function (d) { return x(d[0]) } )
              .attr("cy", function (d) { return y(d[1]) } )
              .attr("r", 2)
              .style("fill", function (d) { return (colorDict[d[2]]) } )
              .on('mouseover', mouseover)
              .on('mouseleave', mouseleave)
              .on('mousemove', mousemove)
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(` ${yMetric}${unitText(yMetric)} vs ${xMetric}${unitText(xMetric)} (n = ${d.length})`);
        var xDropdown = document.createElement('select')
        var yDropdown = document.createElement('select')
        var primaryDropdown = document.createElement('select')
        for (let i=0;i<continuousMetrics.length;i++){
            var m = continuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (xMetric == m){
                dropOption.selected = 'selected'
            }
            dropOption.addEventListener('change', () => {
                updateScatter(id)
                })
            xDropdown.appendChild(dropOption)
        }
        xDropdown.addEventListener('change', () => {
            updateScatter(id)
            })
        for (let i=0;i<continuousMetrics.length;i++){
            var m = continuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (yMetric == m){
                dropOption.selected = 'selected'
            }
            yDropdown.appendChild(dropOption)
        }
        yDropdown.addEventListener('change', () => {
            updateScatter(id)
            })
        for (let i=0;i<Object.keys(filters).length;i++){
            var m = Object.keys(filters)[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (filterList.primary == m){
                dropOption.selected = 'selected'
            }
            primaryDropdown.appendChild(dropOption)
        }
        primaryDropdown.addEventListener('change', () => {
            updateScatter(id)
            })
        var legend = document.createElement('div')
        legend.classList.add('scatter-legend')
        var legendTitle = document.createElement('div')
        legendTitle.classList.add('legend-title')
        legendTitle.innerHTML = 'Color indicates: '
        for (let i=0;i<Object.keys(colorDict).length;i++){
            var m = Object.keys(colorDict)[i]
            var label = document.createElement('span')
            label.classList.add('legend-label')
            label.innerHTML = `<span style="margin-left: 5px;">${m}: </span><span style="color:${colorDict[m]};font-size:50px">&#9632;</span>`
            legend.appendChild(label)
        }
        var xAxisContainer = document.createElement('div')
        var yAxisContainer = document.createElement('div')
        var xAveEl = document.createElement('p')
        var yAveEl = document.createElement('p')
        var xStdevEl = document.createElement('p')
        var yStdevEl = document.createElement('p')
        var xStatWidget = document.createElement('div')
        var yStatWidget = document.createElement('div')
        var xStatBtn = document.createElement('button')
        var yStatBtn = document.createElement('button')
        var filterWidget = document.getElementById(id + 'filters')
        var exportBtn = document.getElementById(id + 'exportBtn')
        xStatBtn.onclick = (e) => {
                if (xStatWidget.classList.contains('show')){
                    e.target.classList.replace('fa-minus', 'fa-plus')
                }   else e.target.classList.replace('fa-plus', 'fa-minus')
                xStatWidget.classList.toggle("show")
            }
        yStatBtn.onclick = (e) => {
                if (yStatWidget.classList.contains('show')){
                    e.target.classList.replace('fa-minus', 'fa-plus')
                }   else e.target.classList.replace('fa-plus', 'fa-minus')
                yStatWidget.classList.toggle("show")
            }
        exportBtn.onclick = () => {save(`${yMetric}_vs_${xMetric}.txt`, d.map(e => e + '\n'))}
        xDropdown.id = id + 'xMetric'
        yDropdown.id = id + 'yMetric'
        primaryDropdown.id = id + 'primary'
        xStatBtn.classList.add('fa')
        xStatBtn.classList.add('fa-plus')
        xStatBtn.classList.add('stat-button')
        yStatBtn.classList.add('fa')
        yStatBtn.classList.add('fa-plus')
        yStatBtn.classList.add('stat-button')
        xAveEl.innerHTML = 'Average: ' + xAve
        yAveEl.innerHTML = 'Average: ' + yAve
        xStdevEl.innerHTML = 'Standard Deviation: ' + xStdev
        yStdevEl.innerHTML = 'Standard Deviation: ' + yStdev
        xStatWidget.classList.add('dropup-content')
        yStatWidget.classList.add('dropup-content')
        xAxisContainer.classList.add('x-axis-container')
        yAxisContainer.classList.add('y-axis-container')
        xStatWidget.appendChild(xAveEl) 
        xStatWidget.appendChild(xStdevEl) 
        yStatWidget.appendChild(yAveEl) 
        yStatWidget.appendChild(yStdevEl) 
        xAxisContainer.appendChild(xStatBtn) 
        yAxisContainer.appendChild(yStatBtn) 
        xAxisContainer.appendChild(xStatWidget) 
        yAxisContainer.appendChild(yStatWidget)
        xAxisContainer.appendChild(xDropdown)
        yAxisContainer.appendChild(yDropdown)
        legendTitle.appendChild(primaryDropdown)
        legend.prepend(legendTitle)
        graphEl.appendChild(legend)
        graphEl.appendChild(xAxisContainer)
        graphEl.appendChild(yAxisContainer)
    }
    function updateScatter(id) {
        var xDropdown = document.getElementById(id + 'xMetric')
        var yDropdown = document.getElementById(id + 'yMetric')
        var primaryDropdown = document.getElementById(id + 'primary')
        var x = xDropdown.value
        var y = yDropdown.value
        var primary = primaryDropdown.value
        var filterList = loadFilters(id)
        filterList['primary'] = primary
        var graphEl = document.getElementById(id + 'graph')
        graphEl.innerHTML = ''
        makeScatter(id, [x,y], filterList)
    }

    function newScatter(){
        var id = "id" + Math.random().toString(16).slice(2)
        liveGraphs['scatter'].push(id)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var infoBtn = document.createElement('button')
        infoBtn.id = id + 'infoBtn'
        infoBtn.classList.add('fa')
        infoBtn.classList.add('fa-info-circle')
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();liveGraphs['scatter'] = liveGraphs['scatter'].filter(item => item !== id)})
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(infoBtn)
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        createFilters(filterWidget, updateScatter, id)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        makeScatter(id, getRandom(continuousMetrics, 2), {'primary': randomProperty(filters)})
    } 
    const countVals = arr => arr.reduce((count, current) => count + current[1], 0);
    function makeBar(id, discrete, classes, continuous, filterObj){
        var [d, numElements] = filterDiscrete(discrete, classes, continuous, filterObj)
        var yList = d.map(e => {return e[1]})
        var yMax = Math.max.apply(null, d.map(e => {return e[1]}))
        var graphEl = document.getElementById(`${id}graph`)
        var svg = d3.select(`#${id}graph`)
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + 100)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");
        var x = d3.scaleBand()
          .range([ 0, width ])
          .domain(d.map(function(d) { return d[0]; }))
          .padding(0.2);
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))
          .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
        var y = d3.scaleLinear()
          .domain([0, yMax])
          .range([ height, 0]);
        svg.append("g")
          .call(d3.axisLeft(y));
        var contString = continuous == 'count' ? 'count' : `average ${continuous}`

          var tooltip = d3
        .select(`#${id}graph`)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", 'absolute')
    var mouseover = function (d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "green").style("opacity", 1);
      };
      var mousemove = function (d) {
        tooltip
          .html(`${d[0]}: ${d[1]}`)
          .style("left", d3.mouse(this)[0] + 70 + "px")
          .style("top", d3.mouse(this)[1] + "px");
      };
      var mouseleave = function (d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
      };
        svg.selectAll("mybar")
          .data(d)
          .enter()
          .append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(String(d[1])); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d[1]); })
            .attr("fill", "#69b3a2")
            .on('mousemove', mousemove)
            .on('mouseover', mouseover)
            .on('mouseleave', mouseleave)
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${contString}${unitText(continuous)} by ${discrete} (n = ${numElements})`);
        var xAxisContainer = document.createElement('div')
        var yAxisContainer = document.createElement('div')
        var filterWidget = document.getElementById(id + 'filters')
        var exportBtn = document.getElementById(id + 'exportBtn')
        var yDropdown = document.createElement('select')
        var xDropdown = document.createElement('select')
        for (let i=0;i<discreteMetrics.length;i++){
            var m = discreteMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (discrete == m){
                dropOption.selected = 'selected'
            }
            xDropdown.appendChild(dropOption)
        }
        for (let i=0;i<countContinuousMetrics.length;i++){
            var m = countContinuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (continuous == m){
                dropOption.selected = 'selected'
            }
            yDropdown.appendChild(dropOption)
        }
        xDropdown.addEventListener('change', () => {
            updateBar(id)
            })
        yDropdown.addEventListener('change', () => {
            updateBar(id)
            })
        var expContString = contString.replace(' ', '')
        exportBtn.onclick = () => {save(`${expContString}_by_${discrete}.txt`, d.map(e => e + '\n'))}
        yDropdown.id = id + 'yMetric'
        xDropdown.id = id + 'xMetric'
        xAxisContainer.classList.add('bar-x-container')
        yAxisContainer.classList.add('y-axis-container')
        xAxisContainer.appendChild(xDropdown)
        yAxisContainer.appendChild(yDropdown)
        graphEl.appendChild(xAxisContainer)
        graphEl.appendChild(yAxisContainer)
    }
    function updateBar(id) {
        var yDropdown = document.getElementById(id + 'yMetric')
        var xDropdown = document.getElementById(id + 'xMetric')
        var y = yDropdown.value
        var x = xDropdown.value
        var filterObj = loadFilters(id)
        var classes = filterObj[x]
        if ( classes == null ) classes = filters[x]
        delete filterObj[x]
        var graphEl = document.getElementById(id + 'graph')
        graphEl.innerHTML = ''
        makeBar(id, x, classes, y, filterObj)
    }
    function newBar(){
        var id = "id" + Math.random().toString(16).slice(2)
        liveGraphs['bar'].push(id)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();liveGraphs['bar'] = liveGraphs['bar'].filter(item => item !== id)})
        var infoBtn = document.createElement('button')
        infoBtn.id = id + 'infoBtn'
        infoBtn.classList.add('fa')
        infoBtn.classList.add('fa-info-circle')
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(infoBtn)
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        createFilters(filterWidget, updateBar, id)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        var barDiscrete = getRandom(discreteMetrics, 1)
        makeBar(id, barDiscrete, filters[barDiscrete], getRandom(countContinuousMetrics, 1), {})
    }
    function makePie(id, discrete, filterObj){
        var [data, colorDict] = filterCount(discrete, filterObj)
        var numElements = countVals(Object.entries(data))
        var w = 450
            h = 450
            m = 40
        var radius = Math.min(w, height) / 2 - m

        var graphEl = document.getElementById(id + 'graph')
        var svg = d3.select(`#${id}graph`)
          .append("svg")
            .attr("width", w)
            .attr("height", h)
          .append("g")
            .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

        var color = d3.scaleOrdinal()
          .domain(data)
          .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"])

        var pie = d3.pie()
          .value(function(d) {return d.value; })
        var data_ready = pie(d3.entries(data))

          var tooltip = d3
        .select(`#${id}graph`)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", 'absolute')

    var mouseover = function (d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "green").style("opacity", 1);
      };
      var mousemove = function (d) {
        tooltip
          .html(`${d.data.key}: ` + d.value)
          .style("left", d3.mouse(this)[0] + 70 + "px")
          .style("top", d3.mouse(this)[1] + 150 + "px");
      };
      var mouseleave = function (d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "black").style("opacity", 0.8);
      };
        svg
          .selectAll('whatever')
          .data(data_ready)
          .enter()
          .append('path')
          .attr('d', d3.arc()
            .innerRadius(0)
            .outerRadius(radius)
          )
          .attr('fill', function(d){ return(colorDict[d.data.key]) })
          .attr("stroke", "black")
          .style("stroke-width", "2px")
          .style("opacity", 0.7)
          .on('mouseover', mouseover)
          .on('mouseleave', mouseleave)
          .on('mousemove', mousemove)
        svg.append("text")
            .attr("x", (width / 4) - 100)
            .attr("y", -180)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`n = ${numElements}`);
        var exportBtn = document.getElementById(id + 'exportBtn')
        exportBtn.onclick = () => {save(`pie_${discrete}_.txt`, Object.entries(data).map(([k,v]) => `${k} ${v}\n`))}
        var xAxisContainer = document.createElement('div')
        var xDropdown = document.createElement('select')
        for (let i=0;i<discreteMetrics.length;i++){
            var m = discreteMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (discrete == m){
                dropOption.selected = 'selected'
            }
            xDropdown.appendChild(dropOption)
        }
        xDropdown.addEventListener('change', () => {
            updatePie(id)
            })
        var legend = document.createElement('div')
        legend.classList.add('pie-legend')
        var legendTitle = document.createElement('div')
        legendTitle.classList.add('legend-title')
        legendTitle.innerHTML = 'Legend'
        legend.appendChild(legendTitle)
        for (let i=0;i<Object.keys(colorDict).length;i++){
            var m = Object.keys(colorDict)[i]
            var label = document.createElement('span')
            label.classList.add('legend-label')
            label.innerHTML = `<span style="margin-left: 5px;">${m}: </span><span style="color:${colorDict[m]};font-size:50px">&#9632;</span>`
            legend.appendChild(label)
        }
        
        xDropdown.id = id + 'xMetric'
        xAxisContainer.classList.add('pie-x-container')
        xAxisContainer.appendChild(xDropdown)
        xAxisContainer.appendChild(legend)
        graphEl.appendChild(xAxisContainer)
    }
    function updatePie(id) {
        var xDropdown = document.getElementById(id + 'xMetric')
        var x = xDropdown.value
        var filterObj = loadFilters(id)
        var graphEl = document.getElementById(id + 'graph')
        graphEl.innerHTML = ''
        makePie(id, x, filterObj)
    }
    function newPie(){
        var id = "id" + Math.random().toString(16).slice(2)
        liveGraphs['pie'].push(id)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var infoBtn = document.createElement('button')
        infoBtn.id = id + 'infoBtn'
        infoBtn.classList.add('fa')
        infoBtn.classList.add('fa-info-circle')
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();liveGraphs['pie'] = liveGraphs['pie'].filter(item => item !== id)})
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(infoBtn)
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        createFilters(filterWidget, updatePie, id)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        makePie(id, getRandom(discreteMetrics, 1), {})
    } 
    function makeHeatmap(id, discreteObj, continuous, filterObj){
        var cats = Object.keys(discreteObj)
        if (cats.length == 1) cats.push(cats[0])
        var myGroups = Object.values(discreteObj)[0]
        var myVars = Object.values(discreteObj)[1] || Object.values(discreteObj)[0]
        var data = filterDiscreteObj(discreteObj, continuous, filterObj)
        var myVals = data.map(e => e[2])
        var valMax = Math.max.apply(null, myVals)
        if (!valMax) valMax = 1
        var svg = d3.select(`#${id}graph`)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleBand()
          .range([ 0, width ])
          .domain(myGroups)
          .padding(0.01);
        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x))

        var y = d3.scaleBand()
          .range([ height, 0 ])
          .domain(myVars)
          .padding(0.01);
        svg.append("g")
          .call(d3.axisLeft(y));
        var contString = continuous == 'count' ? 'count' : `average ${continuous}`
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("id", `${id}continuous`)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${contString} by ${cats[1]} vs ${cats[0]}`);

        var myColor = d3.scaleLinear()
          .range(["white", "#69b3a2"])
          .domain([1, valMax])

          var tooltip = d3
        .select(`#${id}graph`)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", 'absolute')
    var mouseover = function (d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "green").style("opacity", 1);
      };
      var mousemove = function (d) {
        tooltip
          .html(`(${d[0]}, ${d[1]}) : ${d[2]}`)
          .style("left", d3.mouse(this)[0] + 70 + "px")
          .style("top", d3.mouse(this)[1] + "px");
      };
      var mouseleave = function (d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.8);
      };
          svg.selectAll()
              .data(data, function(d) {return d[0]+':'+d[1];})
              .enter()
              .append("rect")
              .attr("x", function(d) { return x(d[0]) })
              .attr("y", function(d) { return y(d[1]) })
              .attr("width", x.bandwidth() )
              .attr("height", y.bandwidth() )
              .style("fill", function(d) { return myColor(d[2])} )
              .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);




        var contDropdown = document.createElement('select')
        contDropdown.classList.add('cont-dropdown') 
        contDropdown.id = id + 'cont'
        var graphEl = document.getElementById(`${id}graph`)
        var exportBtn = document.getElementById(id + 'exportBtn')
        var expContString = contString.replace(' ', '_')
        exportBtn.onclick = () => {save(`${expContString}_by_${cats[1]}_vs_${cats[0]}.txt`, data.map((e => `${e[0]} ${e[1]} ${e[2]}\n`)))}
        var xAxisContainer = document.createElement('div')
        var yAxisContainer = document.createElement('div')
        var xDropdown = document.createElement('select')
        var yDropdown = document.createElement('select')
        for (let i=0;i<discreteMetrics.length;i++){
            var m = discreteMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (cats[1] == m){
                dropOption.selected = 'selected'
            }
            yDropdown.appendChild(dropOption)
        }
        for (let i=0;i<discreteMetrics.length;i++){
            var m = discreteMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (cats[0] == m){
                dropOption.selected = 'selected'
            }
            xDropdown.appendChild(dropOption)
        }
        yDropdown.addEventListener('change', () => {
            updateHeatmap(id)
            })
        xDropdown.addEventListener('change', () => {
            updateHeatmap(id)
            })
        xDropdown.id = id + 'xMetric'
        yDropdown.id = id + 'yMetric'
        xAxisContainer.classList.add('x-axis-container')
        yAxisContainer.classList.add('y-axis-container')
        xAxisContainer.appendChild(xDropdown)
        yAxisContainer.appendChild(yDropdown)
        graphEl.appendChild(xAxisContainer)
        graphEl.appendChild(yAxisContainer)
        for (let i=0;i<countContinuousMetrics.length;i++) {
            var m = countContinuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (continuous == m){
                dropOption.selected = 'selected'
            }
            contDropdown.appendChild(dropOption)
        }
        contDropdown.addEventListener('change', () => {
            updateHeatmap(id)
            })
        var contDropContainer = document.createElement('div')
        var contDropLabel = document.createElement('span')
        contDropLabel.innerHTML = 'Shading indicates: '
        contDropContainer.appendChild(contDropLabel)
        contDropContainer.appendChild(contDropdown)
        contDropContainer.classList.add('cont-drop-container')
        contDropContainer.appendChild(contDropdown)

        graphEl.prepend(contDropContainer)
    }
    function updateHeatmap(id) {
        var xDropdown = document.getElementById(id + 'xMetric')
        var yDropdown = document.getElementById(id + 'yMetric')
        var x = xDropdown.value
        var y = yDropdown.value
        var filterObj = loadFilters(id)
        var discX = filterObj[x]
        var discY = filterObj[y]
        if ( discX == null ) discX = filters[x]
        if ( discY == null ) discY = filters[y]
        delete filterObj[x]
        delete filterObj[y]
        var discreteObj = {}
        discreteObj[x] = discX
        discreteObj[y] = discY
        var contDropdown = document.getElementById(id + 'cont')
        var cont = contDropdown.value
        var graphEl = document.getElementById(`${id}graph`)
        graphEl.innerHTML = ''
        makeHeatmap(id, discreteObj, cont, filterObj)
    }
    function newHeatmap(){
        var id = "id" + Math.random().toString(16).slice(2)
        liveGraphs['heatmap'].push(id)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();liveGraphs['heatmap'] = liveGraphs['heatmap'].filter(item => item !== id)})
        var infoBtn = document.createElement('button')
        infoBtn.id = id + 'infoBtn'
        infoBtn.classList.add('fa')
        infoBtn.classList.add('fa-info-circle')
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(infoBtn)
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        createFilters(filterWidget, updateHeatmap, id)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        var metrics = getRandom(discreteMetrics, 2)
        var discreteObj = {}
        discreteObj[metrics[0]] = filters[metrics[0]]
        discreteObj[metrics[1]] = filters[metrics[1]]
        var cont = getRandom(countContinuousMetrics, 1)
        makeHeatmap(id, discreteObj, cont, {})
    } 
    var dropdown_classes = ['dropdown-content', 'filter-item', 'filter-label', 'dropbtn']
    window.onclick = function(event) {
        var btns = document.getElementsByClassName('dropbtn')
        
        for (i=0; i<dropdown_classes.length;i++){if (event.target.classList.contains(dropdown_classes[i])) return}
        for (var i =0; i < btns.length; i++) {
                btns[i].innerHTML = '&#9660'
        }
        var els = document.getElementsByClassName('dropdown-content')
        for (var i =0; i < els.length; i++) {
            if (els[i].classList.contains('show')){
                els[i].classList.toggle("show")
            }
        }
    }
    function createFilters(widget, updateFunction, pid){
        for (k in filters) {
            var id = "idnumber" + Math.random().toString(16).slice(2)
            var filterTitle = document.createElement('span')
            filterTitle.innerHTML = k
            var filterDropdown = document.createElement('div')
            filterDropdown.classList.add('dropdown')
            var dropContent = document.createElement('div')
            dropContent.id = id
            dropContent.name = k
            dropContent.classList.add('dropdown-content')
            
            //add each filter in filters[k] to dropContent
            for (var i=0;i<filters[k].length;i++){
                f = filters[k][i]
                if (!f.length) continue
                var filterInput = document.createElement('input')
                filterInput.id = f
                filterInput.name = f
                filterInput.classList.add('filter-item')
                filterInput.type= 'checkbox'
                filterInput.addEventListener('change', () => {updateFunction(pid)})
                var filterLabel = document.createElement('label')
                filterLabel.classList.add('filter-label')
                filterLabel.for = f
                filterLabel.innerHTML = f + '<br>'
                dropContent.appendChild(filterInput)
                dropContent.appendChild(filterLabel)
            }

            filterDropdown.appendChild(dropContent)
            var dropBtn = document.createElement('button')
            dropBtn.classList.add('dropbtn')
            dropBtn.innerHTML = '&#9660;'
            dropBtn.id = k + id
            dropBtn.addEventListener("click", function(e) {
                var srch = e.target.id.slice(e.target.id.indexOf('idnumber'))
                var dropEl = document.getElementById(srch)
                if (dropEl.classList.contains('show')){
                    e.target.innerHTML = '&#9660'
                }   else e.target.innerHTML = '&#9650'
                dropEl.classList.toggle("show")
            })
            filterDropdown.appendChild(dropBtn)
            widget.appendChild(filterTitle)
            widget.appendChild(filterDropdown)
        }
    }
    function getRandom(arr, n) {
        var result = new Array(n),
            len = arr.length,
            taken = new Array(len);
        if (n > len)
            throw new RangeError("getRandom: more elements taken than available");
        while (n--) {
            var x = Math.floor(Math.random() * len);
            result[n] = arr[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
        return result;
    }
    function loadFilters(id){
        var filterList = $(`#${id}filters .filter-item`)
        var filterObj = {}
        for (let i = 0; i < filterList.length; i++) {
          if (filterList[i].checked) {
            filterClass = filterList[i].parentElement.name
            if (!(filterClass in filterObj)) filterObj[filterClass] = []
            filterObj[filterClass].push(filterList[i].id)
          }
        }
        return filterObj
    }
})
