/// <reference path="../../typings/main.d.ts" />
/// <reference path="../../typings/browser.d.ts" />
"use strict";
var express = require('express');
var cp = require('child_process');
var shortid = require('shortid');
var fs = require('fs');
var mustache = require('mustache');
var path = require('path');
var spawn = cp.spawn;
var Shell = (function () {
    function Shell(template, name, io, cmd, arg) {
        this.ids = {};
        this.template = template;
        this.name = name;
        this.io = io;
        this.router = this.createRouter();
        this.cmd = cmd;
        this.arg = arg;
    }
    Shell.prototype.createRouter = function () {
        var _this = this;
        var router = express.Router();
        router.get('/', function (req, res) {
            res.send(mustache.render(_this.template, { name: _this.name, title: _this.name }));
            res.end();
        });
        router.post('/create', function (req, res) {
            var id = shortid.generate();
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
        this.io.of('/' + _this.name + '/' + id)
            .on('connection', function (socket) {
            var child = spawn(_this.cmd, _this.arg);
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
            socket.on('stdin', function (data) {
                console.log('stdin: ' + data);
                child.stdin.write(data + '\n');
            });
            socket.on('disconnect', function () {
                delete _this.ids[id];
                child.kill();
            });
        });
        this.ids[id] = true;
        cb();
    };
    return Shell;
}());
;
var ShellDemo = (function () {
    function ShellDemo() {
        this.template = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
        mustache.parse(this.template);
    }
    ShellDemo.prototype.create = function (name, io, cmd, arg) {
        return new Shell(this.template, name, io, cmd, arg);
    };
    ShellDemo.prototype.createJava = function (name, io, jarfile, arg) {
        var javaarg = ['-jar', jarfile].concat(arg);
        return this.create(name, io, 'java', javaarg);
    };
    ShellDemo.prototype.createPython = function (name, io, pyfile, arg) {
        var pyarg = ['-u', pyfile].concat(arg);
        return this.create(name, io, 'python', pyarg);
    };
    return ShellDemo;
}());
exports = module.exports = new ShellDemo();
