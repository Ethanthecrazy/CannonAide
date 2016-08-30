/* global THREE */

var g_GameManager = window.engine.GameManager;
var g_InputManager = window.engine.InputManager;
var g_Player = null;
var g_Scoreboard = null;
var g_Score = 0;
var g_WaveCount = 0;

function AddTimeout(_gameObject, _time) {

    var deathTimer = 0;
    _gameObject.AddUpdateCallback(function(_fDT) {
        deathTimer += _fDT;
        if (deathTimer > _time)
            g_GameManager.Destroy(_gameObject, true);
    });
}

function AddScaleOverTime(_gameObject, _minScale, _maxScale, _duration) {

    var scaleTimer = 0;
    _gameObject.AddUpdateCallback(function(_fDT) {
        scaleTimer += _fDT;
        if (scaleTimer < _duration) {
            var percent = THREE.Math.smoothstep(scaleTimer, 0, _duration);
            var currScale = _minScale + percent * (_maxScale - _minScale);
            _gameObject.m_3DObject.scale.x = currScale;
            _gameObject.m_3DObject.scale.y = currScale;
            _gameObject.m_3DObject.children[0].material.opacity = 1 - percent;
        }
    });
}

function AddDestroyParticle(_gameObject, _matName, _count, _duration, _startScale, _stopScale) {

    _gameObject.AddDestroyCallback(function() {

        var pos = _gameObject.GetPosition();
        var radCount = 0;
        for (var i = 0; i < _count; ++i) {

            var objSprite = g_GameManager.SpawnObject(_matName, true);
            objSprite.SetPosition(pos.x, pos.y);

            radCount += THREE.Math.randFloat(0, 3.14 / 2);
            var vecDir = new THREE.Vector3(1, 0, 0);
            vecDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), radCount);
            vecDir.multiplyScalar(THREE.Math.randFloat(0.05, 0.25));

            objSprite.m_3DObject.rotation.z = THREE.Math.randFloat(0, 3.14 * 2);

            objSprite.SetVelocity(vecDir.x, vecDir.y);
            AddTimeout(objSprite, _duration);
            AddScaleOverTime(objSprite, _startScale, _stopScale, _duration);
        }
    });
}

window.engine.GameManager.AddObjectFunction("AideGame", function( _d3Object) {

    var newObj = new GameObject(null, []);

    g_GameManager.SpawnObject("left-barrier");
    g_GameManager.SpawnObject("right-barrier");
    g_GameManager.SpawnObject("bottom-barrier");
    g_GameManager.SpawnObject("top-barrier");

    g_Player = g_GameManager.SpawnObject("player");
    
    g_Score = 0;
    g_WaveCount = 0;
    g_Scoreboard = g_GameManager.SpawnObject("scoreboard");
    
    newObj.AddUpdateCallback(function(_fDT) {
       
       if( newObj.m_gobChildren.length < 1 ) {
            
            window.engine.GameManager.SpawnObject("waveboard");
            
            var circleForm = g_GameManager.SpawnObject("form-circle");
            
            var bottomLeft = window.engine.Renderer.ScreenToGamePoint(0, 0);
            var topRight = window.engine.Renderer.ScreenToGamePoint(1, 1);
            if (bottomLeft && topRight) {
        
                var vecLoc = new THREE.Vector3(topRight.length() + 8, 0, 0);
        
                for( var i = 0; i < 12; ++i ) {
                    
                    var angle = THREE.Math.randFloat(0, 3.14);
                    vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                    
                    var newSphere = g_GameManager.SpawnObject("sphere");
                    newSphere.SetPosition(vecLoc.x, vecLoc.y);
                    circleForm.AddChild(newSphere);
                }
            }
            
            newObj.AddChild( circleForm );
        }
        
    });
    
    return newObj;
});

window.engine.GameManager.AddObjectFunction("logo", function( _d3Object) {

    var newObj = new GameObject(_d3Object, []);

    g_GameManager.SpawnObject("note");

    _d3Object.scale.x = 89 / 2;
    _d3Object.scale.y = 18 / 2;
    
    newObj.AddUpdateCallback(function(_fDT) {

        if (g_InputManager.GetTouchCount() > 0) {
            g_GameManager.DestroyAll();
            g_GameManager.SpawnObject("AideGame");
        }
    });
    
    return newObj;
});

window.engine.GameManager.AddObjectFunction("note", function( _d3Object) {

    var textObj = window.engine.Renderer.CreateString( "Tap or click to start!", "mat_fixedsys" ); 
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

window.engine.GameManager.AddObjectFunction( "scoreboard", function( _d3Object ){
    
    var textObj = window.engine.Renderer.CreateString( "0", "mat_fixedsys" );
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
        window.engine.Renderer.Remove3DObject( textObj );
        
        // Create new object
        textObj = window.engine.Renderer.CreateString( g_Score.toString(), "mat_fixedsys" );
        _d3Object.add( textObj );
    };
    
    g_Scoreboard = newObj;
    return newObj;
});

window.engine.GameManager.AddObjectFunction( "waveboard", function( _d3Object ){
    
    g_WaveCount += 1;
    
    var textObj = window.engine.Renderer.CreateString( "Wave " + g_WaveCount, "mat_fixedsys" ); 
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
    
    AddTimeout( newObj, 2 );
    
    return newObj;
});


window.engine.GameManager.AddObjectFunction("right-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, window.engine.GameManager.GetColliders("right-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = window.engine.Renderer.ScreenToGamePoint(1, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x + 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("left-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, window.engine.GameManager.GetColliders("left-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = window.engine.Renderer.ScreenToGamePoint(0, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x - 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("bottom-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, window.engine.GameManager.GetColliders("bottom-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = window.engine.Renderer.ScreenToGamePoint(0, 0);
        var rightPoint = window.engine.Renderer.ScreenToGamePoint(1, 0);
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

window.engine.GameManager.AddObjectFunction("top-barrier", function( _d3Object) {

    var newObj = new GameObject(_d3Object, window.engine.GameManager.GetColliders("top-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = window.engine.Renderer.ScreenToGamePoint(0, 1);
        var rightPoint = window.engine.Renderer.ScreenToGamePoint(1, 1);
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

window.engine.GameManager.AddObjectFunction("form-circle", function( _d3Object) {

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
            g_GameManager.Destroy( newObj );
        }
    });

    return newObj;
});