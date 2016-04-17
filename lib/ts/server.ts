/// <reference path="../../typings/main.d.ts" />
/// <reference path="../../typings/browser.d.ts" />

import camelcase = require('camelcase');
import * as stream from "stream";
let {Router} = require('express');
let {render: renderTemplate, parse: parseTemplate} = require('mustache');
let {spawn} = require('child_process');
let {resolve} = require('path');
let {readFileSync} = require('fs');
let {generate: generateID} = require('shortid');

interface Map<T> {
    [K: string]: T;
}

interface ShellArg {
    name: string;
    title: string;
    cmd: string;
    arg: Array<string>;
}

class Shell {
    private router: any;
    private io: SocketIO.Server;
    private ids: Map<Boolean> = {};
    private arg: ShellArg;
    private template: string;
    private script: string;
    constructor(template: string, script: string, io: SocketIO.Server, arg: ShellArg){
        this.template = template;
        this.io = io;
        this.router = this.createRouter();
        this.arg = arg;
    }
    private createRouter(): any{
        let _this = this;
        var router = Router();
        router.get('/', (req, res) => {
            res.redirect('demo');
        });
        router.get('/demo', function(req, res){
            res.send(renderTemplate(_this.template, {name: camelcase(_this.arg.name), title: _this.arg.title}));
            res.end();
        });
        router.get('/client.js', (req, res) => {
            res.send(renderTemplate(_this.script, {name: camelcase(_this.arg.name), title: _this.arg.title}));
            res.end();
        })
        router.post('/create', function(req, res){
            var id = generateID();
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
        var socketEnds = false;
        this.io.of('/' + _this.arg.name + '/' + id)
        .on('connection', function(socket){
            var child = spawn(_this.arg.cmd, _this.arg.arg);
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
            child.on('exit', (code, signal) => {
                console.log('child exit');
                socket.emit('exit', JSON.stringify({code, signal}));
            });
            socket.on('stdin', function(data){
                if(!socketEnds){
                    console.log('stdin: ' + data);
                    child.stdin.write(data + '\n');
                }
            });
            socket.on('disconnect', function(){
                delete _this.ids[id];
                child.kill();
            });
        });
        this.ids[id] = true;
        cb();
    }
    public getRouter(): any{
        return this.router;
    }
};

class ShellDemo{
    private template: string;
    private script: string;
    constructor(){
        this.template = readFileSync(resolve(__dirname, './index.html'), 'utf-8');
        this.script = readFileSync(resolve(__dirname, './client.js'), 'utf-8');
        parseTemplate(this.template);
    }
    create(io: SocketIO.Server, arg: ShellArg): Shell{
        return new Shell(this.template, this.script, io, arg).getRouter();
    }
    createJava(io: SocketIO.Server, {name, title, arg=[], jarfile}: {name: string, title: string, arg: Array<string>, jarfile: string}): Shell{
        arg = ['-jar', jarfile].concat(arg);
        return this.create(io, {name, title: title || name, arg, cmd: 'java'});
    }
    createPython(io: SocketIO.Server, {name, title, arg=[], pyfile}: {name: string, title: string, arg: Array<string>, pyfile: string}): Shell{
        arg = ['-u', pyfile].concat(arg);
        return this.create(io, {name, title: title || name, arg, cmd: 'python'});
    }
}

declare var exports: any;
exports = module.exports = new ShellDemo();
