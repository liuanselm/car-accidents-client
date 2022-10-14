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
const population = {CA:39237836,TX:29527941,FL:21781128,NY:19835913,PA:12964056,IL:12671469,OH:11780017,GA:10799566,NC:10551162,MI:10050811,NJ:9267130,VA:8642274,WA:7738692,AZ:7276316,MA:6984723,TN:6975218,IN:6805985,MO:6168187,MD:6165129,WI:5895908,CO:5812069,MN:5707390,SC:5190705,AL:5039877,LA:4624047,KY:4509394,OR:4246155,OK:3986639,CT:3605597,UT:3322389,IA:3193079,NV:3143991,AR:3025891,MS:2949965,KS:2934582,NM:2115877,NE:1963692,ID:1900923,WV:1782959,HI:1441553,NH:1388992,ME:1372247,RI:1095610,MT:1104271,DE:1003384,SD:895376,ND:774948,AK:732673,VT:645570,WY:578803,DC:670050}
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
            chart[obj[i].State] = [1, population[obj[i].State]]
        } 
        else{
            chart[obj[i].State][0] +=1
        }
    }
    //object for chart, object key is the state, object value for each state is an array containing the values
    var pop = []
    var count = []
    var state = Object.keys(chart)
    for (const[keys,values] of Object.entries(chart)){
        pop.push(values[0]/values[1]*1000000)
        count.push(values[0])
    }
    //call chart function to fill chart
    fillChart([pop,count,state])
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
    var header = ["State", "Count", "Capita"]
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
            values: [chart[2], chart[1], chart[0]],
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
    var layout = {
        xaxis: {
            title: 'Hour'
        },
        yaxis: {
            title: 'Count'
        }
    }
    Plotly.newPlot('compareChart', data, layout, {responsive: true})
}

function sort(obj){
    const sortable = Object.fromEntries(Object.entries(obj).sort(([,a],[,b]) => b-a))
    return sortable
}

document.getElementById('sample').addEventListener('change', function changeSample(){
    console.log('change sample')
    document.getElementById('sampleText').innerHTML = 'Sample Size: ' + document.getElementById('sample').value*500
})
