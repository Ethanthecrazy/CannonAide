var THREE = require("../lib/three.js");
var Renderer = require("../renderer.js").Instance();
var InputManager = require("../input.manager.js").Instance();
var GameManager = require("../game.manager.js").Instance();

var GameObject = require("../gameobject.js");
var Util = require("./util.js");

var g_Score = 0;
var g_WaveCount = 0;

GameManager.AddObjectFunction("AideGame", function( _d3Object) {

    var newObj = new GameObject(null, []);

    GameManager.SpawnObject("left-barrier");
    GameManager.SpawnObject("right-barrier");
    GameManager.SpawnObject("bottom-barrier");
    GameManager.SpawnObject("top-barrier");
    GameManager.SpawnObject("player");
    
    g_Score = 0;
    g_WaveCount = 0;
    GameManager.SpawnObject("scoreboard");
    
    newObj.AddUpdateCallback(function(_fDT) {
       
       if( newObj.m_gobChildren.length < 1 ) {
            
            GameManager.SpawnObject("waveboard");
            
            var circleForm = GameManager.SpawnObject("form-circle");
            
            var bottomLeft = Renderer.ScreenToGamePoint(0, 0);
            var topRight = Renderer.ScreenToGamePoint(1, 1);
            if (bottomLeft && topRight) {
        
                var vecLoc = new THREE.Vector3(topRight.length() + 8, 0, 0);
        
                for( var i = 0; i < 12; ++i ) {
                    
                    var angle = THREE.Math.randFloat(0, 3.14);
                    vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                    
                    var newSphere = GameManager.SpawnObject("sphere");
                    newSphere.SetPosition(vecLoc.x, vecLoc.y);
                    circleForm.AddChild(newSphere);
                }
            }
            
            newObj.AddChild( circleForm );
        }
        
    });
    
    return newObj;
});

GameManager.AddObjectFunction("logo", function( _d3Object) {

    var newObj = new GameObject(_d3Object, []);

    GameManager.SpawnObject("note");

    _d3Object.scale.x = 64 / 2;
    _d3Object.scale.y = 12 / 2;
    
    newObj.AddUpdateCallback(function(_fDT) {

        if (InputManager.GetTouchCount() > 0) {
            GameManager.DestroyAll();
            GameManager.SpawnObject("AideGame");
        }
    });
    
    return newObj;
});

GameManager.AddObjectFunction("note", function( _d3Object) {

    var textObj = Renderer.CreateString( "Tap or click to start!", "mat_fixedsys" ); 
    _d3Object.add( textObj );
        
    var newObj = new GameObject(_d3Object, []);

    _d3Object.scale.x = 2;
    _d3Object.scale.y = 2;
    
    newObj.SetPosition( 0, -10 );
    
    var noteTimer = 0;
    newObj.AddUpdateCallback(function(_fDT) {
        noteTimer += _fDT * 4;
        newObj.SetPosition( 0, -10 + Math.sin( noteTimer ) * 0.5 );
    });
    
    return newObj;
});

GameManager.AddObjectFunction( "scoreboard", function( _d3Object ){
    
    var textObj = Renderer.CreateString( "0", "mat_fixedsys" );
    _d3Object.add( textObj );
        
    _d3Object.scale.x = 3;
    _d3Object.scale.y = 3;
    
    _d3Object.position.z = 16;
    
    var newObj = new GameObject(_d3Object, []);
    
    newObj.SetPosition( 0, 32 - 1 - ( 3 / 2 ) );
    
    newObj.AddScore = function( _increase ) {
        g_Score += _increase;
        
        // Cleanup old text
        _d3Object.remove( textObj );
        Renderer.Remove3DObject( textObj );
        
        // Create new object
        textObj = Renderer.CreateString( g_Score.toString(), "mat_fixedsys" );
        _d3Object.add( textObj );
    };
    
    return newObj;
});

GameManager.AddObjectFunction( "waveboard", function( _d3Object ){
    
    g_WaveCount += 1;
    
    var textObj = Renderer.CreateString( "Wave " + g_WaveCount, "mat_fixedsys" ); 
    _d3Object.add( textObj );
        
    var newObj = new GameObject(_d3Object, []);

    _d3Object.scale.x = 5;
    _d3Object.scale.y = 5;
    _d3Object.position.z = 16;
    
    newObj.SetPosition( 0, 0 );
    
    var displayTimer = 0;
    newObj.AddUpdateCallback(function(_fDT) {
        displayTimer += _fDT;
        var displayPercent = displayTimer / 2;
        
        _d3Object.scale.x = 5 - ( 2 * displayPercent );
        _d3Object.scale.y = 5 - ( 2 * displayPercent );
        
        for( var i = 0; i < textObj.children.length; ++i ) {
            textObj.children[i].material.opacity = 1 - displayPercent;
        }
    });
    
    Util.AddTimeout( newObj, 2 );
    
    return newObj;
});


GameManager.AddObjectFunction("right-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("right-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = Renderer.ScreenToGamePoint(1, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x + 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

GameManager.AddObjectFunction("left-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("left-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = Renderer.ScreenToGamePoint(0, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x - 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

GameManager.AddObjectFunction("bottom-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("bottom-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = Renderer.ScreenToGamePoint(0, 0);
        var rightPoint = Renderer.ScreenToGamePoint(1, 0);
        if (leftPoint && rightPoint) {
            var width = leftPoint.distanceTo(rightPoint);

            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;

            newObj.SetPosition((leftPoint.x + rightPoint.x) / 2, leftPoint.y - 1);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

GameManager.AddObjectFunction("top-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("top-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = Renderer.ScreenToGamePoint(0, 1);
        var rightPoint = Renderer.ScreenToGamePoint(1, 1);
        if (leftPoint && rightPoint) {
            var width = leftPoint.distanceTo(rightPoint);

            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;

            newObj.SetPosition((leftPoint.x + rightPoint.x) / 2, leftPoint.y + 1);
            newObj.SetVelocity(0, 0);
        }
    });

    return newObj;
});

GameManager.AddObjectFunction("form-circle", function( _d3Object) {

    var newObj = new GameObject(_d3Object, null);
    var angle = 0;
    
    newObj.AddUpdateCallback(function(_fDT) {
        
        angle += Math.sin(_fDT) / 3;
        for( var n = 0; n < newObj.m_gobChildren.length; ++n ) {
            var currChild = newObj.m_gobChildren[n];
            var currAngle = ( 3.14 * 2 / newObj.m_gobChildren.length * n ) + angle;
            
            var targetPos = new THREE.Vector3(newObj.m_gobChildren.length + Math.sin( angle ) * newObj.m_gobChildren.length / 2 + 1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), currAngle);
            targetPos.add( newObj.GetPosition() );
            currChild.m_3v2TargetPos = new THREE.Vector2( targetPos.x, targetPos.y );
        }
        
        if( newObj.m_gobChildren.length < 1 ) {
            GameManager.Destroy( newObj );
        }
    });

    return newObj;
});