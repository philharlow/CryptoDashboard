

var defaultIntervals = ["30m", "1h", "6h", "12h", "1d", "7d", "30d"];
var defaultCurrencies = ["BTC", "ETH", "LTC"];//, "ADA", "NEO", "BCH", "XMR", "ARK", "IOT", "SC", "PIVX", "VTC", "BTG", "GRC", "XRP", "PAY", "HST", "WTC", "REQ", "VEN", "XLM"];

var intervals = defaultIntervals;
var currencies = defaultCurrencies;
var apiKey;

var charts = [];
var chartDivs = [];

var currentInterval;
var currentIntervalMinutes;
var currentIntervalDiv;
var lastDisplayedInterval;

var refreshInterval = 330;
var refreshIn = refreshInterval;

var redColor = 'rgba(255,0,0,0.3)';
var greenColor = 'rgba(0,255,0,0.3)';

var graphsPerPage = 12;
var pageIndex = 0;

function setGraphInterval(interval)
{
    currentInterval = interval;
    window.localStorage.setItem("currentInterval", currentInterval);
    // assume minutes
    currentIntervalMinutes = parseInt(currentInterval);
    if (currentInterval.indexOf('h') > -1) currentIntervalMinutes *= 60;
    if (currentInterval.indexOf('d') > -1) currentIntervalMinutes *= 60 * 24;

    console.log("SetInterval: " + currentInterval + " minutes: " + currentIntervalMinutes);

    if (currentIntervalDiv)
        currentIntervalDiv.removeClass("selectedInterval");
    currentIntervalDiv = $(".interval:contains('" + interval + "')");
    currentIntervalDiv.addClass("selectedInterval");
    updateGraphs();
}

var menuVisible = true;
function toggleMenu(button)
{
    setMenuVisible(!menuVisible);
    
    if ($(button).text() == "Save")
    {
        console.log("saving");
        window.localStorage.setItem("intervals", $("input[name=intervals]").val().replace(" ", "").toLowerCase());
        window.localStorage.setItem("apiKey", $("input[name=apiKey]").val());
        var newCurrencies = $("input[name=currencies]").val().replace(" ", "");
        if (newCurrencies.toUpperCase() == "ALL")
            newCurrencies = "BTC,ETH,LTC,ADA,NEO,BCH,XMR,ARK,IOT,SC,PIVX,VTC,BTG,GRC,XRP,PAY,HST,WTC,REQ,VEN,XLM";
        window.localStorage.setItem("currencies", newCurrencies.toUpperCase());
        window.localStorage.setItem("refreshInterval", $("input[name=refreshInterval]").val());
        window.localStorage.setItem("graphsPerPage", $("input[name=graphsPerPage]").val());
        rebuildEverything();
    }
    else if ($(button).text() == "Reset")
    {
        window.localStorage.setItem("apiKey", undefined);
        window.localStorage.setItem("intervals", undefined);
        window.localStorage.setItem("currencies", undefined);
        window.localStorage.setItem("refreshInterval", undefined);
        window.localStorage.setItem("graphsPerPage", undefined);
        console.log("resetting");
        rebuildEverything();
    }
}

function setMenuVisible(visible)
{
    menuVisible = visible;
    console.log("toggle menu visible: " + menuVisible);
    $(".tg").css("display", menuVisible ? "none" : "");
    $(".menuPanel").css("display", menuVisible ? "" : "none");

    if (menuVisible)
    {
        $("input[name=apiKey]").val(apiKey);
        $("input[name=intervals]").val(intervals.join(","));
        $("input[name=currencies]").val(currencies.join(","));
        $("input[name=refreshInterval]").val(refreshInterval);
        $("input[name=graphsPerPage]").val(graphsPerPage);
    }
}

function rebuildEverything()
{
    $(".created").remove();
    init();
}

function checkLocalStorage(name)
{
    if (window.localStorage.getItem(name))
        return window.localStorage.getItem(name) != "undefined";
    return false;
}

function getLocalValue(name, defaultVal)
{
    if (checkLocalStorage(name))
        return window.localStorage.getItem(name)
    return defaultVal;
}

function init()
{
    console.log("Init()");
    $(".menuPanel").css("display", "none");

    if (window.localStorage)
    {
        apiKey = getLocalValue("apiKey", "");
        intervals = getLocalValue("intervals", defaultIntervals.join(",")).split(",");
        currencies = getLocalValue("currencies", defaultCurrencies.join(",")).split(",");
        refreshInterval = getLocalValue("refreshInterval", 60);
        graphsPerPage = getLocalValue("graphsPerPage", 12);
    }

    refreshIn = refreshInterval;

    charts = [];
    chartDivs = [];
    
    for (var i = 0; i < intervals.length; i++)
    {
        var newDiv = $("#intervalTemplate").clone().appendTo("#intervalContainer");
        newDiv.addClass("created");
        newDiv.css("display", "block");
        newDiv.attr("id", "interval" + i);
        newDiv.text(intervals[i]);
    }
    for (var i = 0; i < Math.min(currencies.length - (pageIndex * graphsPerPage), graphsPerPage); i++)
    {
        var globali = i + (pageIndex * graphsPerPage);
        if (currencies[globali].trim().length == 0)
            continue;

        var chartDiv = $("#template").clone().appendTo("#graphContainer");
        chartDiv.addClass("created");
        var newConfig = jQuery.extend(true, {}, chartConfig);
        newConfig.data.datasets[0].label = currencies[globali];

        var ctx = chartDiv.find("canvas")[0].getContext("2d");
        chartDiv.css("display", "block");
        chartDiv.attr("id", "chart" + i);
        chartDiv.attr("symbol", currencies[globali]);
        var lineChart = new Chart(ctx, newConfig);
        charts.push(lineChart);
        chartDivs.push(chartDiv);
        chartDiv.find(".graphName").text(currencies[globali]);
    }


    $(".interval").off('click').on("click", function ()
    {
        setGraphInterval($(this).text());
    });
    $(".menuButton").off('click').on("click", function ()
    {
        toggleMenu();
    });
    $(":button").off('click').on("click", function ()
    {
        toggleMenu(this);
    });
    $(".time").off('click').on("click", function ()
    {
        for (var i = 0; i < charts.length; i++)
        {
            charts[i].tooltip._active = false;

            charts[i].config.options.tooltips.enabled = false;
        }
    });

    $("#time").on({
        "change": function ()
        {
            var newPage = $(this).val();
            window.open(newPage, '_self', false);
        },
        'focus': function ()
        {
            isTimeMenuOpen = true;
        },
        "blur": function ()
        {
            isTimeMenuOpen = false;
        }
    });

    $(".leftButton").off('click').on("click", function ()
    {
        setPage(pageIndex - 1);
    });
    $(".rightButton").off('click').on("click", function ()
    {
        setPage(pageIndex + 1);
    });
    $(".pageDisplay").text((pageIndex + 1) + "/" + (Math.ceil(currencies.length / graphsPerPage)));

    setMenuVisible(false);
    var interval = intervals[0];
    if (window.localStorage.getItem("currentInterval"))
        interval = window.localStorage.getItem("currentInterval");
    setGraphInterval(interval);
    //updateGraphs();
}

function setPage(index)
{
    index = Math.max(index, 0);
    index = Math.min(index, Math.ceil(currencies.length / graphsPerPage) - 1);

    if (pageIndex != index)
    {
        pageIndex = index;
        rebuildEverything();
    }
}

var updating = -1;
function updateGraphs()
{
    if (updating > -1)
        return;

    for (var i = 0; i < charts.length; i++)
    {
        var chart = charts[i];
        chart.config.options.tooltips.enabled = false;
    }

    clearInterval(timeoutInterval);
    updating = -1;
    updateGraph();
}

var timeoutInterval;
var lastUpdated;
function updateGraph()
{
    updating++;
    var samples = 60;
    var intervalSize = currentIntervalMinutes / samples;
    var apiCall = "histominute";
    // over 1d6h
    if (currentIntervalMinutes > 60 * 24 * 1.25)
    {
        apiCall = "histohour";
        intervalSize /= 60;
    }
    // over a week
    /*if (currentIntervalMinutes > 60 * 24 * 7)
    {
        apiCall = "histoday";
        samples = currentIntervalMinutes / (60 * 24);
        intervalSize = 1;
    }*/

    var currentCurrency = currencies[updating + (pageIndex * graphsPerPage)].trim();
    if (currentCurrency.length == 0)
    {
        updateNextGraph();
        return;
    }
        
    var aggregate = Math.ceil(intervalSize);
    var limit = Math.min(currentIntervalMinutes / aggregate, samples);
    var url = "https://min-api.cryptocompare.com/data/" + apiCall + "?fsym=" + currentCurrency + "&tsym=USD&limit=" + limit + "&aggregate=" + aggregate + "&api_key=" + apiKey;


    clearInterval(timeoutInterval);
    timeoutInterval = setInterval(timeoutHandler, 2000);

    //console.log("Getting data for: " + currentCurrency);
    currentJsonRequest = $.getJSON(url, function (data)
    {
        clearInterval(timeoutInterval);
        if (data.Data.length == 0)
        {
            var chartDiv = chartDivs[updating];
            chartDiv.find(".graphName").css("background-color", "red");
            //chartDiv.find(".graphAlert").text("!b");
            console.log("Got BAD data for: " + currentCurrency);
            updateNextGraph();
            return;
        }

        //console.log("Got data for: " + currentCurrency;
        var labelArray = [];
        var dataArray = [];
        var startingIndex = Math.max(0, data.Data.length - limit);
        var startingSample = data.Data[startingIndex];
        var endingSample = data.Data[data.Data.length - 1];
        var startingValue = startingSample.close;
        var startingTime = startingSample.time;
        var endingValue = endingSample.close;
        var endingTime = endingSample.time;
        var startData = [];
        var halfWindowSize = 0;
        //console.log("startingValue is: " + startingValue);
        for (var i = 0; i < limit; i++)
        {
            var sample = data.Data[startingIndex + i];
            dataArray.push(sample.close);
            labelArray.push(new Date(sample.time * 1000).toLocaleString());
            startData.push(startingSample.close);
            halfWindowSize = Math.max(halfWindowSize, Math.abs(sample.close - startingSample.close));
        }
        var newData = {
            labels: labelArray,
            datasets: [{
                yAxisID: 'y-axis-0',
                label: currentCurrency,
                pointStrokeColor: "#58606d",
                pointBorderWidth: 0,
                data: dataArray,
                fill: false,
                fillBetweenSet: 1,
                borderWidth: 1,
                borderColor: "rgba(60,91,87,255)"
            },
                {
                    yAxisID: 'y-axis-0',
                    label: "",
                    pointBorderWidth: 0,
                    data: startData,
                    startingValue: startingValue,
                    fill: false
                }]
        };

        var startTimeStr = new Date(startingSample.time * 1000).toLocaleString();
        var endTimeStr = new Date(endingSample.time * 1000).toLocaleString();

        var differenceStr = getTimeStr(endingSample.time - startingSample.time);

        console.log("got data for graph: " + updating + " (" + (updating + (pageIndex * graphsPerPage)) + ")- start time: " + startTimeStr + " - end time: " + endTimeStr + " - " + differenceStr);


        var chartDiv = chartDivs[updating];
        chartDiv.find(".graphPrice").text("$" + endingValue);
        var delta = Math.round((endingValue - startingValue) / startingValue * 1000) / 10;
        chartDiv.find(".graphDelta").text(Math.abs(delta) + "%");
        var isUp = delta > 0;
        chartDiv.find(".graphPrice").css("background-color", isUp ? greenColor : redColor);
        chartDiv.find(".graphArrow").html(isUp ? "&#x25B2" : "&#x25BC");
        chartDiv.find(".graphArrow").css("color", isUp ? greenColor : redColor);
        //chartDiv.find(".graphAlert").text("");
        chartDiv.find(".graphName").css("background-color", "grey");

        //newData.datasets[0].label = currentCurrency;
        var lineChart = charts[updating];
        lineChart.tooltip._active = false;
        lineChart.config.data = newData;
        lineChart.config.options.animation.duration = lastDisplayedInterval == currentInterval ? 0 : 1000;
        var ticks = lineChart.config.options.scales.yAxes[0].ticks;
        ticks.min = startingValue - halfWindowSize;
        ticks.max = startingValue + halfWindowSize;
        ticks.stepSize = halfWindowSize / 2;
        lineChart.update();

        lastUpdated = new Date();

        updateNextGraph();
    });
}

function timeoutHandler()
{
    if (currentJsonRequest)
        currentJsonRequest.abort();

    var chartDiv = chartDivs[updating];
    //chartDiv.find(".graphAlert").text("!t");
    chartDiv.find(".graphName").css("background-color", "red");
    clearInterval(timeoutInterval);
    $(".lastUpdated").text("REQUEST TIMEOUT! " + new Date().toLocaleString());
    console.log("request timeout for graph: " + updating + " (" + (updating + (pageIndex * graphsPerPage)) + ")");

    updateNextGraph();
}

function updateNextGraph()
{
    clearInterval(timeoutInterval);
    if (updating >= Math.min(currencies.length - (pageIndex * graphsPerPage), graphsPerPage) - 1)
    {
        updating = -1;
        lastDisplayedInterval = currentInterval;

        refreshIn = refreshInterval;

        for (var i = 0; i < charts.length; i++)
        {
            var chart = charts[i];
            chart.config.options.tooltips.enabled = true;
        }

    }
    else
        updateGraph();

}

function getTimeStr(delta)
{
    var dd = Math.floor(delta / 60 / 60 / 24);
    var hh = Math.floor((delta / 60 / 60) % 24);
    var mm = Math.floor((delta / 60) % 60);
    var ss = Math.floor(delta % 60);
    var str = "";
    if (dd > 0) str += dd + "d";
    if (hh > 0) str += hh + "h";
    if (mm > 0) str += mm + "m";
    if (ss > 0 || str.length == 0) str += ss + "s";
    return str;
}

Chart.defaults.NegativeTransparentLine = Chart.helpers.clone(Chart.defaults.line);
Chart.controllers.NegativeTransparentLine = Chart.controllers.line.extend({
    update: function ()
    {
        if (this.chart.data.datasets[0].data.length > 0)
        {
            // get the min and max values
            var min = Math.min.apply(null, this.chart.data.datasets[0].data);
            var max = Math.max.apply(null, this.chart.data.datasets[0].data);
            var yScale = this.getScaleForId(this.getDataset().yAxisID);

            if (max - min != 0)
            {
                // figure out the pixels for these and the value 0
                var top = yScale.getPixelForValue(max);
                var zero = yScale.getPixelForValue(this.chart.data.datasets[1].startingValue);
                var bottom = yScale.getPixelForValue(min);

                // build a gradient that switches color at the 0 point
                var ctx = this.chart.chart.ctx;
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);
                var ratio = Math.min((zero - top) / (bottom - top), 1);

                gradient.addColorStop(0, greenColor);
                gradient.addColorStop(ratio, greenColor);
                gradient.addColorStop(ratio, redColor);
                gradient.addColorStop(1, redColor);
                this.chart.data.datasets[0].backgroundColor = gradient;
            }
        }

        return Chart.controllers.line.prototype.update.apply(this, arguments);
    },
    draw: function (ease)
    {
        Chart.controllers.line.prototype.draw.call(this, ease);

        if (this.chart.tooltip._active && this.chart.tooltip._active.length)
        {
            var activePoint = this.chart.tooltip._active[0],
                ctx = this.chart.chart.ctx,
                x = activePoint.tooltipPosition().x,
                topY = this.chart.scales['y-axis-0'].top,
                bottomY = this.chart.scales['y-axis-0'].bottom;

            this.chart.config.options.tooltips.enabled = true;
            // draw line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#999999';
            ctx.stroke();
            ctx.restore();
        }
    }

});


var chartConfig = {
    type: 'NegativeTransparentLine',
    data: {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [{
            yAxisID: 'y-axis-0',
            label: "Loading...",
            strokeColor: "rgba(60,91,87,255)",
            pointColor: "rgba(60,91,87,255)",
            pointStrokeColor: "#58606d",
            pointBorderWidth: 0,
            data: [],
            fill: false,
            fillBetweenSet: 1,
        },
        {
            yAxisID: 'y-axis-0',
            label: "",
            pointBorderWidth: 0,
            data: [],
            startingValue: -20,
            fill: false
        }]
    },
    options:
    {
        scales:
        {
            xAxes: [{
                display: false
            }],
            yAxes: [{
                display: true,
                ticks: {
                    min: 0,
                    max: 100,
                    stepSize: 20
                }
            }]
        },
        legend: {
            display: false,
            labels: {
                boxWidth: 0
            },
            onClick: (e) => e.stopPropagation()
        },
        elements:
        {
            point:
            {
                radius: 0
            },
            line: {
                tension: 0
            }

        },
        tooltips: {
            enabled: false,
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
    }
};


var isTimeMenuOpen = false;
function updateTime()
{
    if (isTimeMenuOpen)
        return;

    // Set the current time and date on the clock
    $('.placeholder').html(new Date().toLocaleTimeString());
    //$('#date').html(new Date().toLocaleDateString());

    if (refreshIn > 0)
    {
        refreshIn--;
        if (refreshIn == 0)
            updateGraphs();

        $(".refreshDisplay").css("height", Math.round(100 * (1 - (refreshIn / refreshInterval))) + "%");
        //$(".refreshDisplayOuter").text(refreshIn + "s");
    }

    var updateDeltaTime = new Date() - lastUpdated;
    $(".lastUpdated").text(updateDeltaTime > refreshInterval * 2 * 1000 ? "Last updated: " + lastUpdated.toLocaleString() : "");
}


var fillBetweenLinesPlugin = {
    afterDatasetsDraw: function (chart)
    {
        var ctx = chart.chart.ctx;
        var xaxis = chart.scales['x-axis-0'];
        var yaxis = chart.scales['y-axis-0'];
        var datasets = chart.data.datasets;
        ctx.save();

        for (var d = 0; d < datasets.length; d++)
        {
            var dataset = datasets[d];
            if (dataset.fillBetweenSet == undefined)
            {
                continue;
            }

            // get meta for both data sets
            var meta1 = chart.getDatasetMeta(d);
            var meta2 = chart.getDatasetMeta(dataset.fillBetweenSet);

            // do not draw fill if one of the datasets is hidden
            if (meta1.hidden || meta2.hidden) continue;

            // create fill areas in pairs
            for (var p = 0; p < meta1.data.length - 1; p++)
            {
                // if null skip
                if (dataset.data[p] == null || dataset.data[p + 1] == null) continue;

                ctx.beginPath();

                // trace line 1
                var curr = meta1.data[p];
                var next = meta1.data[p + 1];
                var above = dataset.data[p] > datasets[1].data[p];
                ctx.moveTo(curr._view.x, curr._view.y);
                ctx.lineTo(curr._view.x, curr._view.y);
                if (curr._view.steppedLine === true)
                {
                    ctx.lineTo(next._view.x, curr._view.y);
                    ctx.lineTo(next._view.x, next._view.y);
                }
                else if (next._view.tension === 0)
                {
                    ctx.lineTo(next._view.x, next._view.y);
                }
                else
                {
                    ctx.bezierCurveTo(
                        curr._view.controlPointNextX,
                        curr._view.controlPointNextY,
                        next._view.controlPointPreviousX,
                        next._view.controlPointPreviousY,
                        next._view.x,
                        next._view.y
                    );
                }

                // connect dataset1 to dataset2
                var curr = meta2.data[p + 1];
                var next = meta2.data[p];
                ctx.lineTo(curr._view.x, curr._view.y);

                // trace BACKWORDS set2 to complete the box
                if (curr._view.steppedLine === true)
                {
                    ctx.lineTo(curr._view.x, next._view.y);
                    ctx.lineTo(next._view.x, next._view.y);
                }
                else if (next._view.tension === 0)
                {
                    ctx.lineTo(next._view.x, next._view.y);
                }
                else
                {
                    // reverse bezier
                    ctx.bezierCurveTo(
                        curr._view.controlPointPreviousX,
                        curr._view.controlPointPreviousY,
                        next._view.controlPointNextX,
                        next._view.controlPointNextY,
                        next._view.x,
                        next._view.y
                    );
                }

                // close the loop and fill with shading
                ctx.closePath();
                var bgColor = dataset.backgroundColor;// above ? dataset.fillUpColor : dataset.fillDownColor;
                ctx.fillStyle = bgColor || "rgba(0,0,0,0.1)";
                ctx.fill();
            } // end for p loop
        }
    } // end afterDatasetsDraw
}; // end fillBetweenLinesPlugin

Chart.pluginService.register(fillBetweenLinesPlugin);

window.onload = init;

setInterval(updateTime, 1000);
updateTime();