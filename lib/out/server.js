"use strict";
var camelcase = require('camelcase');
var Router = require('express').Router;
var _a = require('mustache'), renderTemplate = _a.render, parseTemplate = _a.parse;
var spawn = require('child_process').spawn;
var resolve = require('path').resolve;
var readFileSync = require('fs').readFileSync;
var generateID = require('shortid').generate;
var Shell = (function () {
    function Shell(template, script, io, arg) {
        this.ids = {};
        this.template = template;
        this.script = script;
        this.io = io;
        this.router = this.createRouter();
        this.arg = arg;
    }
    Shell.prototype.createRouter = function () {
        var _this = this;
        var router = Router();
        router.get('/', function (req, res) {
            res.redirect('demo');
        });
        router.get('/demo', function (req, res) {
            res.send(renderTemplate(_this.template, { name: camelcase(_this.arg.name), title: _this.arg.title }));
            res.end();
        });
        router.get('/client.js', function (req, res) {
            res.send(renderTemplate(_this.script, { name: camelcase(_this.arg.name), title: _this.arg.title }));
            res.end();
        });
        router.post('/create', function (req, res) {
            var id = generateID();
            _this.startServerSocket(id, {}, function (error) {
                if (error) {
                    res.status(500);
                    res.send();
                }
                else {
                    res.send(id);
                }
            });
        });
        return router;
    };
    Shell.prototype.startServerSocket = function (id, params, cb) {
        var _this = this;
        var socketEnds = false;
        this.io.of('/' + _this.arg.name + '/' + id)
            .on('connection', function (socket) {
            var child = spawn(_this.arg.cmd, _this.arg.arg);
            child.stdout.setEncoding('utf-8');
            child.stderr.setEncoding('utf-8');
            child.stdout.on('data', function (data) {
                console.log('stdout: ' + data);
                socket.emit('stdout', data.toString('utf-8'));
            });
            child.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
                socket.emit('stderr', data.toString('utf-8'));
            });
            child.on('exit', function (code, signal) {
                console.log('child exit');
                socket.emit('exit', JSON.stringify({ code: code, signal: signal }));
            });
            socket.on('stdin', function (data) {
                if (!socketEnds) {
                    console.log('stdin: ' + data);
                    child.stdin.write(data + '\n');
                }
            });
            socket.on('disconnect', function () {
                delete _this.ids[id];
                child.kill();
            });
        });
        this.ids[id] = true;
        cb();
    };
    Shell.prototype.getRouter = function () {
        return this.router;
    };
    return Shell;
}());
;
var ShellDemo = (function () {
    function ShellDemo() {
        this.template = readFileSync(resolve(__dirname, './index.html'), 'utf-8');
        this.script = readFileSync(resolve(__dirname, './client.js'), 'utf-8');
        parseTemplate(this.template);
    }
    ShellDemo.prototype.create = function (io, arg) {
        return new Shell(this.template, this.script, io, arg).getRouter();
    };
    ShellDemo.prototype.createJava = function (io, _a) {
        var name = _a.name, title = _a.title, _b = _a.arg, arg = _b === void 0 ? [] : _b, jarfile = _a.jarfile;
        arg = ['-jar', jarfile].concat(arg);
        return this.create(io, { name: name, title: title || name, arg: arg, cmd: 'java' });
    };
    ShellDemo.prototype.createPython = function (io, _a) {
        var name = _a.name, title = _a.title, _b = _a.arg, arg = _b === void 0 ? [] : _b, pyfile = _a.pyfile;
        arg = ['-u', pyfile].concat(arg);
        return this.create(io, { name: name, title: title || name, arg: arg, cmd: 'python' });
    };
    return ShellDemo;
}());
exports = module.exports = new ShellDemo();
