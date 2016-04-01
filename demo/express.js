var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var demo = require('../lib/out/index.js');

var java = demo.createJava('java', io, path.resolve(__dirname + './../code/java/SimpleJava.jar'), ['asf']);
var python = demo.createPython('python', io, path.resolve(__dirname + './../code/python/simplepython.py'), ['zxc', '-u']);

app.use('/java', java.router);
app.use('/python', python.router);

http.listen(8000);