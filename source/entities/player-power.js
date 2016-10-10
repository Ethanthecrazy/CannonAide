var THREE = require("../lib/three.js");
var GameManager = require("../game.manager.js").Instance();
var GameObject = require("../gameobject.js");

GameManager.AddObjectFunction("player-power", function(_d3Object) {
    
    var newObj = new GameObject(_d3Object, null );
    
    var powerTimer = -1;
    var scale = 2;
    
    newObj.AddUpdateCallback(function(_fDT) {

        powerTimer += _fDT;

        if (powerTimer > 3) {
            GameManager.Destroy(newObj);
        }
        
        if(powerTimer < 1) {
            scale += _fDT * 4;
            
            if( scale > 16 ) {
                scale = 16;
            }
            
            _d3Object.scale.x = scale;
            _d3Object.scale.y = scale;
        }
        
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
            if( dist <= scale / 2 ) {
                powerTimer = 0;
                GameManager.Destroy( proj );
            }
            
        });
        
    });

    return newObj;

});