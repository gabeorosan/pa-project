$(document).ready(function() {
    const searchInput = document.getElementById('search-input')
    const searchCapsidButton = document.getElementById('search-capsid-button')
    const openBtn = document.getElementById('openbtn')
    const scatterBtn = document.getElementById('scatter-btn')
    const barBtn = document.getElementById('bar-btn')
    const searchOutput = document.getElementById('search-output')
    const graphContainer = document.getElementById('graph-container')
    var continuousMetrics; var discreteMetrics; var globalData; var filters;
    var margin = {top: 30, right: 30, bottom: 30, left: 60},
        width = vw(95) - 250  - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    var dataRef = firebase.database().ref('/data/')
    var propRef = firebase.database().ref('/properties/')
    var filterRef = firebase.database().ref('/filters/')

    dataRef.get().then(res => {
        globalData = res.val()
    })
    propRef.get().then(res => {
        continuousMetrics = res.val()['continuous']
        discreteMetrics = res.val()['discrete']
    })
    filterRef.get().then(res => {
        filters = res.val()
    })

    searchCapsidButton.addEventListener("click", searchCapsid)
    openBtn.addEventListener("click", toggleNav)
    scatterBtn.addEventListener("click", newScatter)
    barBtn.addEventListener("click", newBar)
    function vw(percent) {
      var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      return (percent * w) / 100;
    }
    function toggleNav() {
      document.getElementById("mySidebar").classList.toggle('show-sidebar')
      document.getElementById("main").classList.toggle('sidebar-margin')
    }
    const average = arr => sum(arr) / arr.length
    const sum = arr => {var sum=0; var i=arr.length; while(i--) {sum += arr[i]}; return sum}
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
    function filterDiscrete(discrete, classes, continuous, filters) {
        var res = []
        var d = Object.values(globalData).filter(e => {return ((discrete in e) && (continuous in e) &&
        (!(isNaN(e[continuous]))))})
        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filters).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(filters[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })
        for (let i=0;i<classes.length;i++) {
            var classFilter = filtered.filter(e => {return (e[discrete] == classes[i])})
            var classAvg = average(classFilter.map(e => {return e[continuous]}))
            if (isNaN(classAvg)) classAvg = 0
            res.push([classes[i], Math.round(classAvg)])
        }
        return res
    }
    function filterContinuous(metrics, filters) {
        var x = metrics[0]
        var y = metrics[1]
        var d = Object.values(globalData).filter(e => (x in e) &&
        (y in e) && !(isNaN(e[x])) && !(isNaN(e[y])))
        var filtered = []
        var filtered = d.filter(e => {
            var passFilter = true
            Object.keys(filters).forEach(function(key, index) {
            if (!(key in e)) passFilter = false
            else if (!(filters[key].includes(String(e[key])))) passFilter = false
        })
            return passFilter
        })
        return filtered.map(e =>[e[x], e[y]])
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
    function numSig(n) {
        n = Math.abs(String(n).replace(".", "")); //remove decimal and make positive
        if (n == 0) return 0;
        while (n != 0 && n % 10 == 0) n /= 10; //kill the 0s at the end of n

        return Math.floor(Math.log(n) / log10) + 1; //get number of digits
    }
    function roundLast(x) {
        var res = '1'.padEnd(String(x).length + 1, "0")
        return res
    }
    function makeScatter(id, metrics, filterList){
        var d = filterContinuous(metrics, filterList)
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
                .domain([0, roundLast(yMax)])
                .range([ height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));
        svg.append('g')
            .selectAll("dot")
            .data(d)
            .enter()
            .append("circle")
              .attr("cx", function (d) { return x(d[0]) } )
              .attr("cy", function (d) { return y(d[1]) } )
              .attr("r", 1.5)
              .style("fill", "#69b3a2")
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`${xMetric} vs ${yMetric} (n = ${d.length})`);
        var xDropdown = document.createElement('select')
        var yDropdown = document.createElement('select')
        for (let i=0;i<continuousMetrics.length;i++){
            var m = continuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (xMetric == m){
                dropOption.selected = 'selected'
            }
            xDropdown.appendChild(dropOption)
        }
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
        exportBtn.onclick = () => {save('data.txt', d.map(e => e + '\n'))}
        xDropdown.id = id + 'xMetric'
        yDropdown.id = id + 'yMetric'
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
        graphEl.appendChild(xAxisContainer)
        graphEl.appendChild(yAxisContainer)
    }
    function newScatter(){
        var id = "id" + Math.random().toString(16).slice(2)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var updateBtn = document.createElement('button')
        updateBtn.classList.add('fa')
        updateBtn.classList.add('fa-refresh')
        updateBtn.addEventListener('click', () => {
            var xDropdown = document.getElementById(id + 'xMetric')
            var yDropdown = document.getElementById(id + 'yMetric')
            var x = xDropdown.value
            var y = yDropdown.value
            var filterList = loadFilters(id)
            graphEl.innerHTML = ''
            makeScatter(id, [x,y], filterList)
            })
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();})
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        filterWidget.appendChild(updateBtn)
        createFilters(filterWidget)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        makeScatter(id, getRandom(continuousMetrics, 2), {})
    } 
    function makeBar(id, discrete, classes, continuous, filterObj){
        var d = filterDiscrete(discrete, classes, continuous, filterObj)
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
          .domain([0, roundLast(yMax)])
          .range([ height, 0]);
        svg.append("g")
          .call(d3.axisLeft(y));
        svg.selectAll("mybar")
          .data(d)
          .enter()
          .append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(String(d[1])); })
            .attr("width", x.bandwidth())
            .attr("height", function(d) { return height - y(d[1]); })
            .attr("fill", "#69b3a2")
        svg.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text(`average ${continuous} by ${discrete}`);
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
        for (let i=0;i<continuousMetrics.length;i++){
            var m = continuousMetrics[i]
            var dropOption = document.createElement('option')
            dropOption.value = m
            dropOption.innerHTML = m
            if (continuous == m){
                dropOption.selected = 'selected'
            }
            yDropdown.appendChild(dropOption)
        }
        exportBtn.onclick = () => {save('data.txt', d.map(e => e + '\n'))}
        yDropdown.id = id + 'yMetric'
        xDropdown.id = id + 'xMetric'
        xAxisContainer.classList.add('bar-x-container')
        yAxisContainer.classList.add('y-axis-container')
        xAxisContainer.appendChild(xDropdown)
        yAxisContainer.appendChild(yDropdown)
        graphEl.appendChild(xAxisContainer)
        graphEl.appendChild(yAxisContainer)
    }
    function newBar(){
        var id = "id" + Math.random().toString(16).slice(2)
        var graphWidget = document.createElement('div')
        var graphEl = document.createElement('div')
        graphWidget.classList.add('graph-widget')
        graphEl.id = id + 'graph'
        graphEl.classList.add('graph-element')
        var filterWidget = document.createElement('div')
        filterWidget.id = id + 'filters'
        var delBtn = document.createElement('button')
        var updateBtn = document.createElement('button')
        updateBtn.classList.add('fa')
        updateBtn.classList.add('fa-refresh')
        updateBtn.addEventListener('click', () => {
            var yDropdown = document.getElementById(id + 'yMetric')
            var xDropdown = document.getElementById(id + 'xMetric')
            var y = yDropdown.value
            var x = xDropdown.value
            var filterObj = loadFilters(id)
            var classes = filterObj[x]
            if ( classes == null ) classes = getRandom(filters[x], 5)
            delete filterObj[x]
            graphEl.innerHTML = ''
            makeBar(id, x, classes, y, filterObj)
            })
        var exportBtn = document.createElement('button')
        exportBtn.id = id + 'exportBtn'
        exportBtn.classList.add('fa')
        exportBtn.classList.add('fa-download')
        delBtn.classList.add('fa-trash-o')
        delBtn.classList.add('fa')
        delBtn.addEventListener('click', () => {graphWidget.remove();})
        filterWidget.classList.add('filter-container')
        filterWidget.appendChild(delBtn)
        filterWidget.appendChild(exportBtn)
        filterWidget.appendChild(updateBtn)
        createFilters(filterWidget)
        graphWidget.appendChild(filterWidget)
        graphWidget.appendChild(graphEl)
        graphContainer.appendChild(graphWidget)
        var barDiscrete = getRandom(discreteMetrics, 1)
        makeBar(id, barDiscrete, getRandom(filters[barDiscrete], 5), getRandom(continuousMetrics, 1), {})
    }
    function createFilters(widget){
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
                var filterLabel = document.createElement('label')
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
