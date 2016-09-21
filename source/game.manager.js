/* global $ */

var Renderer = require("./renderer.js").Instance();
var GameObject = require("./gameobject.js");

var FIXED_TIMESTEP = 0.0416;

//==============================================================================
//==============================================================================
function GameManager() {
    this.m_nLastUpdate = 0;
    this.m_nFixedTimer = 0;
    this.m_CreateFunctions = {};
    this.m_ObjectTamplates = {};
    this.m_Collisions = [];
    this.m_GameObjects = [];
    this.m_ColliderLayers = {};
    this.m_DestroyQueue = [];
}

//==============================================================================
var g_GameManager = null;
GameManager.Instance = function() {

    if (!g_GameManager) {
        g_GameManager = new GameManager();
    }

    return g_GameManager;
};

//==============================================================================
GameManager.prototype.Load = function(_path, _collPath) {
    var that = this;
    $.getJSON(_path, function(_Index) {

        for (var objName in _Index.objects) {
            that.m_ObjectTamplates[objName] = _Index.objects[objName];
        }

        $.getJSON(_collPath, function(_collIndex) {

            that.m_Collisions = _collIndex["collisions"];
            that.onload();

        }).fail(function() {
            console.log("Failed to load '" + _path + "'.");
        });

    }).fail(function() {
        console.log("Failed to load '" + _path + "'.");
    });
};

// empty default just to have it exist
//==============================================================================
GameManager.prototype.onload = function() {

};

//==============================================================================
GameManager.prototype.GetColliders = function(_name) {

    return this.m_ObjectTamplates[_name]["colliders"];
};

//==============================================================================
GameManager.prototype.Start = function() {
    this.m_nLastUpdate = Date.now();
};

//==============================================================================
GameManager.prototype.AddObjectFunction = function(_name, _funcCreate) {
    this.m_CreateFunctions[_name] = _funcCreate;
};

//==============================================================================
GameManager.prototype.SpawnObject = function(_name) {

    var d3Object = null;
    var templateObject = this.m_ObjectTamplates[_name];
    var gameObject = null;

    if (templateObject) {
        d3Object = Renderer.CreateRenderObject(templateObject["elements"]);
    }
    else {
        console.warn("No object template found for '" + _name + "'.");
        d3Object = Renderer.CreateRenderObject([]);
    }

    if (this.m_CreateFunctions[_name]) {
        gameObject = this.m_CreateFunctions[_name](d3Object);
        if (!gameObject) {
            console.error("Create function '" + _name + "' did not return an object.");
            return;
        }
    }
    else {
        gameObject = new GameObject(d3Object, this.GetColliders(_name));
    }

    for (var i = 0; i < gameObject.GetColliderCount(); ++i) {
        var currColl = gameObject.GetCollider(i);

        var layerArray = this.m_ColliderLayers[currColl.layer];
        if (!layerArray) {
            layerArray = [];
            this.m_ColliderLayers[currColl.layer] = layerArray;
        }

        layerArray.push({
            object: gameObject,
            index: i
        });
    }

    this.m_GameObjects.push(gameObject);

    return gameObject;
};

//==============================================================================
GameManager.prototype.GetAllObjects = function(_testFunc) {

    var returnList = [];

    this.m_GameObjects.forEach(function(currentValue, index, array) {

        if (_testFunc(currentValue)) {
            returnList.push(currentValue);
        }
    });

    return returnList;

};

//==============================================================================
GameManager.prototype.Update = function() {

    var that = this;
    this.m_GameObjects.forEach(function(currentValue, index, array) {
        if (currentValue.isDestroyed) {
            that.Destroy(currentValue);
        }
    });

    // Clean up objects to destroy
    while (this.m_DestroyQueue.length > 0) {
        var currDestroy = this.m_DestroyQueue[0];

        if (!currDestroy.gmpQuiteDeath) {
            for (var itr in currDestroy.m_onDestroyCallbacks) {
                currDestroy.m_onDestroyCallbacks[itr]();
            }
        }


        if (currDestroy.m_3DObject) {
            Renderer.Remove3DObject(currDestroy.m_3DObject);
        }

        this.RemoveGameObject(currDestroy);

        this.m_DestroyQueue.shift();
    }


    // Calculate delta time
    var now = Date.now();
    var dt = (now - this.m_nLastUpdate) / 1000;
    this.m_nLastUpdate = now;

    if (dt > 0.1) {
        dt = 0.1;
    }

    this.m_nFixedTimer += dt;

    while (this.m_nFixedTimer > FIXED_TIMESTEP) {
        this.m_nFixedTimer -= FIXED_TIMESTEP;
        this.m_GameObjects.forEach(function(currentValue, index, array) {
            currentValue.FixedUpdate(FIXED_TIMESTEP);
        });

        for (var c = 0; c < this.m_Collisions.length; ++c) {
            var currCollision = this.m_Collisions[c];

            var firstLayer = this.m_ColliderLayers[currCollision[0]];
            var secondLayer = this.m_ColliderLayers[currCollision[1]];

            if (!firstLayer || !secondLayer)
                continue;

            for (var i = 0; i < firstLayer.length; ++i) {
                var firstCollider = firstLayer[i].object.GetCollider(firstLayer[i].index);

                for (var n = 0; n < secondLayer.length; ++n) {
                    var secondCollider = secondLayer[n].object.GetCollider(secondLayer[n].index);

                    if (this.DoCollision(firstCollider.parent, firstCollider, secondCollider.parent, secondCollider)) {
                        firstCollider.parent.onCollision(secondCollider);
                        secondCollider.parent.onCollision(firstCollider);
                    }
                }
            }
        }
    }

    this.m_GameObjects.forEach(function(currentValue, index, array) {
        currentValue.InterpolatePosition(that.m_nFixedTimer / FIXED_TIMESTEP);
        currentValue.Update(dt);
    });
};

//==============================================================================
GameManager.prototype.DoCollision = function(_object1, _collider1, _object2, _collider2) {

    if (!_collider1 || !_collider2)
        return false;

    if (Object.is(_object1, _object2))
        return false;

    if (_collider1.intersectsBox(_collider2)) {

        var vToColl2 = _collider2.center().sub(_collider1.center());

        var xSign = Math.sign(vToColl2.x);
        vToColl2.x = Math.abs(_collider1.size().x / 2 + _collider2.size().x / 2 - Math.abs(vToColl2.x));

        var ySign = Math.sign(vToColl2.y);
        vToColl2.y = Math.abs(_collider1.size().y / 2 + _collider2.size().y / 2 - Math.abs(vToColl2.y));

        if (_collider1.physics && _collider2.physics) {

            if (Math.abs(vToColl2.x) < Math.abs(vToColl2.y)) {

                _object1.ShiftPostion(vToColl2.x / -2 * xSign, 0);
                _object2.ShiftPostion(vToColl2.x / 2 * xSign, 0);
            }
            else {

                _object1.ShiftPostion(0, vToColl2.y / -2 * ySign);
                _object2.ShiftPostion(0, vToColl2.y / 2 * ySign);
            }
        }

        return true;
    }

    return false;
};

GameManager.prototype.Destroy = function(_object, _isQuiet) {
    if (!this.m_DestroyQueue.includes(_object)) {

        if (_isQuiet)
            _object.gmpQuiteDeath = true;

        this.m_DestroyQueue.push(_object);
    }
};

GameManager.prototype.DestroyAll = function() {

    var that = this;
    this.m_GameObjects.forEach(function(currObj) {
        that.Destroy(currObj, true);
    });
};

//==============================================================================
GameManager.prototype.RemoveGameObject = function(_object) {

    for (var i = 0; i < _object.GetColliderCount(); ++i) {
        var currColl = _object.GetCollider(i);

        var currLayer = this.m_ColliderLayers[currColl.layer];
        var index = currLayer.findIndex(function(element, index, array) {
            return Object.is(element.object, _object) && element.index == i;
        });

        currLayer.splice(index, 1);
    }

    var objIndex = this.m_GameObjects.indexOf(_object);
    if (objIndex > -1) {
        this.m_GameObjects.splice(objIndex, 1);
    }

    if (_object.m_gobParent) {
        _object.m_gobParent.RemoveChild(_object);
    }

    for (var n = 0; n < _object.m_gobChildren.length; ++n) {
        this.RemoveGameObject(_object.m_gobChildren[n]);
    }
};

module.exports = GameManager;