var THREE = require("./lib/three.js");

//==============================================================================
function GameObject(_3DObject, _colliderList) {
    this.m_3vPrevPos = new THREE.Vector3(0, 0, 0);
    this.m_3vCurrPos = new THREE.Vector3(0, 0, 0);

    this.m_bCollisionPhysics = false;

    this.m_3DObject = _3DObject;
    this.m_3Colliders = _colliderList;
    
    this.m_gobParent = null;
    this.m_gobChildren = [];

    this.m_onUpdateCallbacks = [];
    this.m_onCollisionCallbacks = [];
    this.m_onDestroyCallbacks = [];

    this.isDestroyed = false;
    this.m_timeSinceDamage = 60;
}

//==============================================================================
GameObject.prototype.SetPosition = function(_x, _y, _z) {

    var vOffset = new THREE.Vector2();
    vOffset.subVectors(this.m_3vPrevPos, this.m_3vCurrPos);

    if( _z == undefined ) {
        _z = 0;
    }

    this.m_3vCurrPos.set(_x, _y, _z);
    this.m_3vPrevPos.set(_x, _y, _z);
    
    if (this.m_3DObject) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y;
    }
};

//==============================================================================
GameObject.prototype.ShiftPostion = function(_x, _y) {
    this.m_3vCurrPos.x += _x;
    this.m_3vCurrPos.y += _y;
};

//==============================================================================
GameObject.prototype.GetPosition = function() {
    return this.m_3vCurrPos;
};

//==============================================================================
GameObject.prototype.SetVelocity = function(_x, _y) {
    var vNewVel = new THREE.Vector3(-_x, -_y, 0);
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
GameObject.prototype.InterpolatePosition = function( _timeAhead ) {
    
    var vel = this.GetVelocity();
    vel.multiplyScalar( _timeAhead );
    
    if (this.m_3DObject) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x + vel.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y + vel.y;
    }
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

    if (this.m_nHealth) {
        this.m_timeSinceDamage += _fDelta;
    }
    
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

    if (this.m_3Colliders)
        return this.m_3Colliders.length;

    return 0;
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
    newBox.physics = collSource["physics"];
    newBox.parent = this;

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
            this.isDestroyed = true;
        }
        
        this.m_timeSinceDamage = 0;
    }
};

GameObject.prototype.AddDestroyCallback = function(_callback) {

    this.m_onDestroyCallbacks.push(_callback.bind(this));
};

GameObject.prototype.AddChild = function( _child ) {
    
    if( this.m_gobChildren.indexOf( _child ) < 0 ) {
        this.m_gobChildren.push(_child);
    }
    
    _child.m_gobParent = this;
};

GameObject.prototype.RemoveChild = function( _child ) {
    
    var objIndex = this.m_gobChildren.indexOf(_child);
    if (objIndex > -1) {
        this.m_gobChildren.splice(objIndex, 1);
        _child.m_gobParent = null;
    }
};

module.exports = GameObject;