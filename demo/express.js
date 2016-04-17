var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var demo = require('../lib/out/server.js');

app.use('/javaDemo', demo.createJava(io, {
        name: 'javaDemo',
        jarfile: path.resolve(__dirname + './../code/java/SimpleJava.jar'),
        arg: ['asf']
    }));

app.use('/python', demo.createPython(io, {
        name: 'Simple Python Demo',
        pyfile: path.resolve(__dirname + './../code/python/simplepython.py'),
        arg: ['zxc', '-u']
    }));

http.listen(8000);
