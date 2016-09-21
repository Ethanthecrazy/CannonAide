var Renderer = require("./renderer.js").Instance();
var InputManager = require("./input.manager.js").Instance();
var GameManager = require("./game.manager.js").Instance();


function requireAll(r) { r.keys().forEach(r); }
requireAll(require.context('./entities/', true, /\.js$/));

/* global Stats */
var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

var time = (new Date()).getTime();
var canvas = document.getElementById("viewport");
InputManager.Init(canvas);

Renderer.Init(canvas);
Renderer.Load("resources/index.json?t=" + time);
Renderer.onLoad = function() {

    GameManager.Load("resources/objects.json?t=" + time, "resources/collisions.json?t=" + time);
    GameManager.onload = function() {

        document.getElementById("progContainer").style.display = "none";
        GameManager.Start();
        GameManager.SpawnObject("logo");
        main();
    };
};

function main() {

    requestAnimationFrame(main);
    stats.begin();
    GameManager.Update();
    Renderer.Render();
    stats.end();
}