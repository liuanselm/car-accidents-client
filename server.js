const express = require('express')
const app = express()
const server = require('http').createServer(app)
const WebSocket = require('ws')

const wss = new WebSocket.Server({ server:server})

var mysql = require('mysql');

wss.on('connection', function connection(ws) {
    console.log("a new client")
    ws.on('message', function message(data) {
      var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "Suhdudenoodles1!",
        database: "caraccidents"
      });
      con.connect(function(err) {
        if (err) throw err;
        console.log('connected as id ' + con.threadId);
        con.query(data.toString(), function (err, result, fields) {
          if (err) throw err;
          ws.send(JSON.stringify(result))
        });
      })
    });
  });

app.get('/', (req, res) => res.send('Hello'))

server.listen(3000, ()=> console.log('Listening'))

//SELECT State, AVG(Severity) 'Severity' FROM us_accidents_dec21_updated group by State ORDER BY RAND() LIMIT 10000