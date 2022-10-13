//set up connection to server to ws
const socket = new WebSocket('ws://localhost:3000')

socket.addEventListener('open', function(event){
    console.log('connected to ws')
})

//recieve response from server with the query data
//call plot function to data on map
socket.addEventListener('message', function(event){
    var e = JSON.parse(event.data)
    plot(e)
})

//send query to server
function sendMessage(){
    socket.send(querygen())
}

function sendChartMessage(){
    socket.send("SELECT hour(Start_Time) 'Start_Time', COUNT(*) 'Count' FROM (SELECT Start_Time FROM accidents order by rand() Limit 10000) AS a Group by hour(Start_Time)")
}

//create custom query
function querygen(){
    //time
    var select = "SELECT State, Start_Lat, Start_Lng"
    var startTime = '';
    var endTime = '';
    var where = ''
    var lowTemp = document.getElementById("lowTemp").value
    var highTemp = document.getElementById("highTemp").value

    if (document.getElementById("displayTime").checked){
        select += ", Start_Time"
    }

    if (document.getElementById("displayStreet").checked){
        select += ", Street"
    }

    if (document.getElementById("displaySeverity").checked){
        select += ", Severity"
    }

    if (document.getElementById("displayWeather").checked){
        select += ", Weather_Condition"
    }

    if (document.getElementById("StartTime").value != ''){
        startTime = (new Date(document.getElementById("StartTime").value)).toISOString().slice(0, 19).replace('T', ' ')
    }
    if (document.getElementById("EndTime").value != ''){
        endTime = (new Date(document.getElementById("EndTime").value)).toISOString().slice(0, 19).replace('T', ' ')
    }
    if (startTime == '' && endTime == ''){
        where = ''
    }
    else if (startTime == '' && endTime != ''){
        where = "End_Time<'"+endTime+"'"
    }
    else if (startTime != '' && endTime == ''){
        where = "Start_Time>'"+startTime+"'"
    }
    else if (startTime != '' && endTime != ''){
        where = "Start_Time BETWEEN '"+startTime+"' AND '" +endTime+"'"
    }
        
    if (lowTemp != '' && highTemp != ''){
        where += " AND `Temperaturef` BETWEEN " + lowTemp + " AND " + highTemp + " AND `Temperaturef` <> ''"
    }
    var query = select + " FROM accidents WHERE " + where + " ORDER BY RAND() LIMIT " + (document.getElementById("sample").value)*500
    return query
}

//plot function to plot on map
function plot(obj){
    var chart = {}
    const lat = []
    const lng = []
    const display = []
    var str = ""

    for (i=0;i<obj.length;i++){
        str = ""
        lat.push(obj[i].Start_Lat)
        lng.push(obj[i].Start_Lng)
        str += obj[i].Weather_Condition + "|"
        str += obj[i].Street + "|"
        str += obj[i].Severity + "|"
        str += obj[i].Start_Time

        display.push(str)
        //adds up the counts on accidents for each state
        if (chart[obj[i].State] == null){
            chart[obj[i].State] = 1
        } 
        else{
            chart[obj[i].State] +=1
        }
    }
    //call chart function to fill chart
    fillChart(sort(chart))
    //map attributes

    var data = [{
        type: 'scattergeo',
        locationmode: 'USA-states',
        lat: lat,
        lon: lng,
        text: display
    }];
    var layout = {
        autosize: true,
        title: '2016-2021 Recorded Car Accidents in the USA',
        showlegend: false,
        geo: {
            scope: 'usa',
            projection: {
                type: 'albers usa'
            },
            showland: true,
            landcolor: 'rgb(217, 217, 217)',
            subunitwidth: 1,
            countrywidth: 1,
            subunitcolor: 'rgb(255,255,255)',
            countrycolor: 'rgb(255,255,255)'
        }
    }
    Plotly.newPlot("myDiv", data, layout, {responsive: true});
}

function fillChart(chart){
    var headerColor = "grey";
    var header = ["State", "Count"]
    var data = [{
        type: 'table',
        header: {
            values: header,
            align: "center",
            line: {width: 1, color: 'black'},
            fill: {color: headerColor},
            font: {family: "Arial", size: 12, color: "white"}
        },
        cells: {
            values: [Object.keys(chart), Object.values(chart)],
            align: "center",
            line: {color: "black", width: 1},
            font: {family: "Arial", size: 11, color: ["black"]}
        }
    }]
    Plotly.newPlot('tdiv', data, {}, {responsive: true});
}

function compareChart(obj){
    var month = []
    var count = []

    for (var i = 0; i < obj.length; i++){
        count.push(obj[i].Count)
        month.push(obj[i].Start_Time)
    }
    var data = [
        {
            x: month,
            y: count,
            type: 'bar'
        }
    ]
    Plotly.newPlot('compareChart', data, {}, {responsive: true})
}

function sort(obj){
    const sortable = Object.fromEntries(Object.entries(obj).sort(([,a],[,b]) => b-a))
    return sortable
}