# shelldemo [Work in Progress]

A command line application on your browser + An express middleware

## Installation

` npm install --save shelldemo `


## Usage Demo
```javascript
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var demo = require('shelldemo');

// create a new command line application with name, path, arguments
var java = demo.createJava('java', io, path.resolve(__dirname + './../code/java/SimpleJava.jar'), ['asf']);
var python = demo.createPython('python', io, path.resolve(__dirname + './../code/python/simplepython.py'), ['zxc', '-u']);

//use it like an express Router
app.use('/java', java.router);
app.use('/python', python.router);

http.listen(8000);
```

## To Do List
* Include other languages, eg: Ruby, perl, etc.
* Provide options for user to specify or input arguments
* ...
