/* global THREE */

//==============================================================================
function GameObject( _3DObject, _colliderList ) {
    this.m_3vPrevPos = new THREE.Vector2( 0, 0 );
    this.m_3vCurrPos = new THREE.Vector2( 0, 0 );
    
    this.m_bCollisionPhysics = false;
    
    this.m_3DObject = _3DObject;
    this.m_3Colliders = _colliderList;
    
    this.m_onUpdateCallbacks = [];
    this.m_onCollisionCallbacks = [];
    this.m_onDestroyCallbacks = [];
}

//==============================================================================
GameObject.prototype.AddCollider = function( _collider ) {
    this.m_3Colliders.push( _collider );
};

//==============================================================================
GameObject.prototype.SetPosition = function( _x, _y ) {
    
    var vOffset = new THREE.Vector2();
    vOffset.subVectors( this.m_3vPrevPos, this.m_3vCurrPos );
    
    this.m_3vCurrPos.set( _x, _y );
    this.m_3vPrevPos.addVectors( this.m_3vCurrPos, vOffset );
};

//==============================================================================
GameObject.prototype.GetPosition = function() {
  return this.m_3vCurrPos;  
};

//==============================================================================
GameObject.prototype.SetVelocity = function( _x, _y ) {
    var vNewVel = new THREE.Vector2( -_x, -_y );
    this.m_3vPrevPos.addVectors( this.m_3vCurrPos, vNewVel );
};

//==============================================================================
GameObject.prototype.Get3DObject = function() {
  return this.m_3DObject;  
};

GameObject.prototype.AddUpdateCallback = function( _callback ) {
  this.m_onUpdateCallbacks.push( _callback.bind(this) );  
};

//==============================================================================
GameObject.prototype.Update = function( _fDelta ) {
    
    for( var updateItr in this.m_onUpdateCallbacks ){
        var currCall = this.m_onUpdateCallbacks[updateItr];
        currCall( _fDelta );
    }
};

//==============================================================================
GameObject.prototype.FixedUpdate = function() {
    
    var newPrevPos = this.m_3vCurrPos.clone();
    this.m_3vCurrPos.multiplyScalar( 2 );
    this.m_3vCurrPos.subVectors( this.m_3vCurrPos, this.m_3vPrevPos );
    this.m_3vPrevPos = newPrevPos;
    
    if( this.m_3DObject ) {
        this.m_3DObject.position.x = this.m_3vCurrPos.x;
        this.m_3DObject.position.y = this.m_3vCurrPos.y;
    }
};

//==============================================================================
GameObject.prototype.onCollision = function( _otherGameobject ) {
    
    for( var itr in this.m_onCollisionCallbacks ){
        var currCall = this.m_onCollisionCallbacks[itr];
        currCall();
    }
};

//==============================================================================
GameObject.prototype.Destroy = function() {
    
    for( var itr in this.m_onDestroyCallbacks ){
        var currCall = this.m_onDestroyCallbacks[itr];
        currCall();
    }
    
    window.engine.GameManager.RemoveGameObject( this );
    
    if( this.m_3DObject ) {
        window.engine.Renderer.Remove3DObject( this.m_3DObject );
    }
};

var FIXED_TIMESTEP = 0.0333;

//==============================================================================
function GameManager() {
    this.m_nLastUpdate = 0;
    this.m_nFixedTimer = 0;
    this.m_CreateFunctions = {};
    this.m_GameObjects = [];
}

//==============================================================================
GameManager.prototype.Start = function() {
    this.m_nLastUpdate = Date.now();
};

//==============================================================================
GameManager.prototype.AddObjectFunction = function( _name, _funcCreate ) {
    this.m_CreateFunctions[ _name ] = _funcCreate;
};

//==============================================================================
GameManager.prototype.SpawnObject = function( _name ) {
    
    var d3Object = window.engine.Renderer.CreateRenderObject( _name );
    var gameObject = null;
    
    if( this.m_CreateFunctions[ _name ] ) {
        gameObject = this.m_CreateFunctions[ _name ]( d3Object );
    }
    else {
        gameObject = new GameObject( d3Object, [] );
    }
    
    this.m_GameObjects.push( gameObject );
    return gameObject;
};

//==============================================================================
GameManager.prototype.Update = function() {
    
    // Calculate delta time
    var now = Date.now();
    var dt = ( now - this.m_nLastUpdate ) / 1000;
    this.m_nLastUpdate = now;
    
    this.m_GameObjects.forEach( function( currentValue, index, array ){
        currentValue.Update( dt );
    });
    
    this.m_nFixedTimer += dt;
    while( this.m_nFixedTimer > FIXED_TIMESTEP ) {
        this.m_nFixedTimer -= FIXED_TIMESTEP;
        this.m_GameObjects.forEach( function( currentValue, index, array ){
            currentValue.FixedUpdate(FIXED_TIMESTEP);
        });
    }
};

//==============================================================================
GameManager.prototype.RemoveGameObject = function( _object ) {
    this.m_GameObjects.splice( this.m_GameObjects.indexOf( _object ), 1 );
};

if( !window.engine )
    window.engine = {};

window.engine.GameManager = new GameManager();