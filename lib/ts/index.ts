/// <reference path="../../typings/main.d.ts" />
/// <reference path="../../typings/browser.d.ts" />

import express = require('express');
import cp = require('child_process');
import shortid = require('shortid');
import fs = require('fs');
import mustache = require('mustache');
import path = require('path');
import * as stream from "stream";

let spawn = cp.spawn;

interface Map<T> {
    [K: string]: T;
}

class Shell {
    private router: any;
    private name: string;
    private io: SocketIO.Server;
    private ids: Map<Boolean> = {};
    private cmd: string;
    private arg: Array<string>;
    private template: string;
    constructor(template: string, name: string, io: SocketIO.Server, cmd: string, arg: Array<string>){
        this.template = template;
        this.name = name;
        this.io = io;
        this.router = this.createRouter();
        this.cmd = cmd;
        this.arg = arg;
    }
    private createRouter(): any{
        let _this = this;
        var router = express.Router();
        router.get('/', function(req, res){
            res.send(mustache.render(_this.template, {name: _this.name, title: _this.name}));
            res.end();
        });
        router.post('/create', function(req, res){
            var id = shortid.generate();
            _this.startServerSocket(id, {}, function(error){
                if (error) {
                    res.status(500);
                    res.send();
                } else{
                    res.send(id);  
                }
            });
        });
        return router;
    }
    private startServerSocket(id: string, params: any, cb: Function){
        var _this = this;
        this.io.of('/' + _this.name + '/' + id)
        .on('connection', function(socket){
            var child = spawn(_this.cmd, _this.arg);
            child.stdout.setEncoding('utf-8');
            child.stderr.setEncoding('utf-8');
            child.stdout.on('data', function(data){
                console.log('stdout: ' + data);
                socket.emit('stdout', data.toString('utf-8'));
            });
            child.stderr.on('data', function(data){
                console.log('stderr: ' + data);
                socket.emit('stderr', data.toString('utf-8'));
            });
            socket.on('stdin', function(data){
                console.log('stdin: ' + data);
                child.stdin.write(data + '\n');
            });
            socket.on('disconnect', function(){
                delete _this.ids[id];
                child.kill();
            });
        });
        this.ids[id] = true;
        cb();
    }
};

class ShellDemo{
    private template: string;
    constructor(){
        this.template = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
        mustache.parse(this.template);
    }
    create(name: string, io: SocketIO.Server, cmd: string, arg: Array<string>): Shell{
        return new Shell(this.template, name, io, cmd, arg);
    }
    createJava(name: string, io: SocketIO.Server, jarfile: string, arg: Array<string>): Shell{
        var javaarg = ['-jar', jarfile].concat(arg);
        return this.create(name, io, 'java', javaarg);
    }
    createPython(name: string, io: SocketIO.Server, pyfile: string, arg: Array<string>): Shell{
        var pyarg = ['-u', pyfile].concat(arg);
        return this.create(name, io, 'python', pyarg);
    }
}

declare var exports: any;
exports = module.exports = new ShellDemo();