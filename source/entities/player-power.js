var THREE = require("../lib/three.js");
var GameManager = require("../game.manager.js").Instance();
var GameObject = require("../gameobject.js");

GameManager.AddObjectFunction("player-power", function(_d3Object) {
    
    var newObj = new GameObject(_d3Object, null );
    
    var scale = 2;
    var scalePerSecond = 16;
    var powerTimer = -1 / scalePerSecond * 4;
    var maxTime = 3;
    
    _d3Object.children[0].material.map.magFilter = THREE.NearestFilter;
    _d3Object.children[0].material.map.minFilter = THREE.NearestFilter;
    
    newObj.AddUpdateCallback(function(_fDT) {

        powerTimer += _fDT;

        if (powerTimer > maxTime) {
            GameManager.Destroy(newObj);
            return;
        }
        
        if(powerTimer < 0 ) {
            scale += _fDT * scalePerSecond;
            
            if( scale > 16 ) {
                scale = 16;
            }
        }
        else {
            scale -= _fDT / 8;
        }
        
        _d3Object.scale.x = scale;
        _d3Object.scale.y = scale;
        _d3Object.rotation.z = Math.random() * 3.1415 * 2;
            
        var opacity = 1;
        if( powerTimer > maxTime - 1 ) {
            opacity = 1 - (powerTimer - ( maxTime - 1) );
        }
        
        _d3Object.children[0].material.opacity = opacity;
            
        var projectiles = GameManager.GetAllObjects( function( _obj ) {
            
            for( var i = 0; i < _obj.GetColliderCount(); ++i ) {
                
                if( _obj.GetCollider( i ).layer == "e-bullet" ) {
                    
                    return true;
                }
            }
            
            return false;
        });
        
        
        
        projectiles.forEach( function(proj) {
            
            var toVec = proj.GetPosition().clone().sub( newObj.GetPosition() );
            var dist = toVec.length();
            if( dist <= scale / 2 + 0.5 ) {
                powerTimer = -1 / scalePerSecond;
                GameManager.Destroy( proj );
            }
            
        });
        
    });

    return newObj;

});