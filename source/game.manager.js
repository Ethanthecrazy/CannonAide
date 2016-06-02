/* global THREE */
/* global $ */

//==============================================================================
function GameObject(_3DObject, _colliderList) {
    this.m_3vPrevPos = new THREE.Vector2(0, 0);
    this.m_3vCurrPos = new THREE.Vector2(0, 0);

    this.m_bCollisionPhysics = false;

    this.m_3DObject = _3DObject;
    this.m_3Colliders = _colliderList;

    this.m_onUpdateCallbacks = [];
    this.m_onCollisionCallbacks = [];
    this.m_onDestroyCallbacks = [];
    
    this.isDestroyed = false;
}

//==============================================================================
GameObject.prototype.SetPosition = function(_x, _y) {

    var vOffset = new THREE.Vector2();
    vOffset.subVectors(this.m_3vPrevPos, this.m_3vCurrPos);

    this.m_3vCurrPos.set(_x, _y);
    this.m_3vPrevPos.addVectors(this.m_3vCurrPos, vOffset);

    if (this.m_3DObject) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y;
    }
};

//==============================================================================
GameObject.prototype.ShiftPostion = function(_x, _y) {
    this.m_3vCurrPos.x += _x;
    this.m_3vCurrPos.y += _y;

    if (this.m_3DObject) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y;
    }
};

//==============================================================================
GameObject.prototype.GetPosition = function() {
    return this.m_3vCurrPos;
};

//==============================================================================
GameObject.prototype.SetVelocity = function(_x, _y) {
    var vNewVel = new THREE.Vector2(-_x, -_y);
    this.m_3vPrevPos.addVectors(this.m_3vCurrPos, vNewVel);
};

//==============================================================================
GameObject.prototype.AddVelocity = function(_x, _y, _cap) {
    var vNewVel = new THREE.Vector2(-_x, -_y);
    this.m_3vPrevPos.addVectors(this.m_3vPrevPos, vNewVel);

    if (_cap) {
        var vToOldPos = this.m_3vPrevPos.sub(this.m_3vCurrPos);
        vToOldPos.clampLength(-_cap, _cap);
        this.m_3vPrevPos.addVectors(this.m_3vCurrPos, vToOldPos);
    }
};

//==============================================================================
GameObject.prototype.GetVelocity = function() {
    return new THREE.Vector2(this.m_3vCurrPos.x - this.m_3vPrevPos.x, this.m_3vCurrPos.y - this.m_3vPrevPos.y);
};

//==============================================================================
GameObject.prototype.Get3DObject = function() {
    return this.m_3DObject;
};

GameObject.prototype.AddUpdateCallback = function(_callback) {

    this.m_onUpdateCallbacks.push(_callback.bind(this));
};

//==============================================================================
GameObject.prototype.Update = function(_fDelta) {

    for (var updateItr in this.m_onUpdateCallbacks) {
        var currCall = this.m_onUpdateCallbacks[updateItr];
        currCall(_fDelta);
    }
};

//==============================================================================
GameObject.prototype.FixedUpdate = function() {

    var newPrevPos = this.m_3vCurrPos.clone();
    this.m_3vCurrPos.multiplyScalar(2);
    this.m_3vCurrPos.subVectors(this.m_3vCurrPos, this.m_3vPrevPos);
    this.m_3vPrevPos = newPrevPos;

    if (this.m_3DObject) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y;
    }
};

//==============================================================================
GameObject.prototype.AddCollider = function(_collider) {
    this.m_3Colliders.push(_collider);
};

//==============================================================================
GameObject.prototype.GetColliderCount = function() {
    return this.m_3Colliders.length;
};

//==============================================================================
GameObject.prototype.GetCollider = function(_nIndex) {
    var collSource = this.m_3Colliders[_nIndex];

    var v2Min = new THREE.Vector2(collSource.left, collSource.bottom);
    var v2Max = new THREE.Vector2(collSource.right, collSource.top);
    v2Min.add(this.m_3vCurrPos);
    v2Max.add(this.m_3vCurrPos);

    var newBox = new THREE.Box2(v2Min, v2Max);
    // decoreate the box
    newBox.layer = collSource["layer"];

    return newBox;
};

//==============================================================================
GameObject.prototype.AddCollisionCallback = function(_callback) {

    this.m_onCollisionCallbacks.push(_callback.bind(this));
};

//==============================================================================
GameObject.prototype.onCollision = function(_otherGameobject) {

    for (var itr in this.m_onCollisionCallbacks) {
        var currCall = this.m_onCollisionCallbacks[itr];
        currCall(_otherGameobject);
    }
};

GameObject.prototype.Damage = function(_amount) {
    if (this.m_nHealth) {
        this.m_nHealth -= _amount;

        if (this.m_nHealth < 1) {
            this.Destroy();
        }
    }
};

GameObject.prototype.AddDestroyCallback = function(_callback) {

    this.m_onDestroyCallbacks.push(_callback.bind(this));
};

//==============================================================================
GameObject.prototype.Destroy = function() {
    
    if( this.isDestroyed )
        return;
    
    for (var itr in this.m_onDestroyCallbacks) {
        var currCall = this.m_onDestroyCallbacks[itr];
        currCall();
    }

    if (this.m_3DObject) {
        window.engine.Renderer.Remove3DObject(this.m_3DObject);
    }

    window.engine.GameManager.RemoveGameObject(this);
    
    this.isDestroyed = true;
};

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
    this.m_GameProps = [];
}

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
GameManager.prototype.SpawnObject = function(_name, _isProp) {
    
    var d3Object = null;
    var templateObject = this.m_ObjectTamplates[_name];
    var gameObject = null;
    
    if( templateObject ) {
        d3Object = window.engine.Renderer.CreateRenderObject( templateObject["mesh"], templateObject["material"] );
    }
    else {
        console.log( "No object template found for '" + _name + "'.");
    }
    
    if (this.m_CreateFunctions[_name]) {
        gameObject = this.m_CreateFunctions[_name](null, d3Object);
        if (!gameObject) {
            console.error("Create function '" + _name + "' did not return an object.");
            return;
        }
    }
    else {
        gameObject = new GameObject(d3Object, this.GetColliders(_name));
    }

    if( _isProp ) {
        this.m_GameProps.push(gameObject);
    }
    else {
        this.m_GameObjects.push(gameObject);
    }
    
    return gameObject;
};

//==============================================================================
GameManager.prototype.Update = function() {

    // Calculate delta time
    var now = Date.now();
    var dt = (now - this.m_nLastUpdate) / 1000;
    this.m_nLastUpdate = now;

    this.m_nFixedTimer += dt;
    if (this.m_nFixedTimer > FIXED_TIMESTEP * 10) {
        this.m_nFixedTimer = FIXED_TIMESTEP * 10;
    }

    while (this.m_nFixedTimer > FIXED_TIMESTEP) {
        this.m_nFixedTimer -= FIXED_TIMESTEP;
        this.m_GameObjects.forEach(function(currentValue, index, array) {
            currentValue.FixedUpdate(FIXED_TIMESTEP);
        });

        this.m_GameProps.forEach(function(currentValue, index, array) {
            currentValue.FixedUpdate(FIXED_TIMESTEP);
        });
        
        for (var i = 0; i < this.m_GameObjects.length; ++i) {
            var firstObject = this.m_GameObjects[i];

            for (var n = i + 1; n < this.m_GameObjects.length; ++n) {
                var secondObject = this.m_GameObjects[n];

                for (var v = 0; v < firstObject.GetColliderCount(); ++v) {
                    var firstCollider = firstObject.GetCollider(v);

                    for (var k = 0; k < secondObject.GetColliderCount(); ++k) {
                        var secondCollider = secondObject.GetCollider(k);

                        if (this.DoCollision(firstObject, firstCollider, secondObject, secondCollider)) {
                            firstObject.onCollision(secondObject);
                            secondObject.onCollision(firstObject);
                        }
                    }
                }
            }
        }
    }

    this.m_GameObjects.forEach(function(currentValue, index, array) {
        currentValue.Update(dt);
    });
    
    this.m_GameProps.forEach(function(currentValue, index, array) {
        currentValue.Update(dt);
    });
};

//==============================================================================
GameManager.prototype.DoesCollide = function(_firstLayer, _secondLayer) {

    var foundMatch = false;
    var that = this;

    that.m_Collisions.forEach(function(currColl) {
        var tempColl = currColl.slice();
        var firstIndex = tempColl.indexOf(_firstLayer);
        
        if( firstIndex > -1 ) {
            tempColl.splice(firstIndex, 1);
            
            if( tempColl.includes(_secondLayer) ) {
                foundMatch = true;
            }
        }
    });

    return foundMatch;
};

//==============================================================================
GameManager.prototype.DoCollision = function(_object1, _collider1, _object2, _collider2) {

    if (!_collider1 || !_collider2)
        return false;

    if (!this.DoesCollide(_collider1["layer"], _collider2["layer"])) {
        return false;
    }

    if (_collider1.intersectsBox(_collider2)) {

        var vToColl2 = _collider2.center().sub(_collider1.center());

        var xSign = Math.sign(vToColl2.x);
        vToColl2.x = Math.abs(_collider1.size().x / 2 + _collider2.size().x / 2 - Math.abs(vToColl2.x));

        var ySign = Math.sign(vToColl2.y);
        vToColl2.y = Math.abs(_collider1.size().y / 2 + _collider2.size().y / 2 - Math.abs(vToColl2.y));

        if (Math.abs(vToColl2.x) < Math.abs(vToColl2.y)) {

            _object1.ShiftPostion(vToColl2.x / -2 * xSign, 0);
            _object2.ShiftPostion(vToColl2.x / 2 * xSign, 0);
        }
        else {

            _object1.ShiftPostion(0, vToColl2.y / -2 * ySign);
            _object2.ShiftPostion(0, vToColl2.y / 2 * ySign);
        }

        return true;
    }

    return false;
};

//==============================================================================
GameManager.prototype.RemoveGameObject = function(_object) {
    
    var objIndex = this.m_GameObjects.indexOf(_object);
    if( objIndex > -1 ) {
        this.m_GameObjects.splice( objIndex, 1);
    }
    
    var propIndex = this.m_GameProps.indexOf(_object);
    if( propIndex > -1 ) {
        this.m_GameProps.splice( propIndex, 1);
    }
};

GameManager.prototype.DestroyAll = function() {
    while (this.m_GameObjects.length > 0)
        this.m_GameObjects[0].Destroy();
        
    while (this.m_GameProps.length > 0)
        this.m_GameProps[0].Destroy();
};

if (!window.engine)
    window.engine = {};

window.engine.GameManager = new GameManager();