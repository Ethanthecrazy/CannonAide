/* global GameObject */

window.engine.GameManager.AddObjectFunction("player", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("player"));

    var fireTimer = 1;
    
    newObj.AddUpdateCallback(function(_fDT) {

        var Input = window.engine.InputManager;
        var anyMove = false;

        if (Input.IsKeyDown(37)) {

            newObj.AddVelocity(-20 * _fDT, 0, 1);
            anyMove = true;
        }

        if (Input.IsKeyDown(38)) {

            newObj.AddVelocity(0, 20 * _fDT, 1);
            anyMove = true;

        }

        if (Input.IsKeyDown(39)) {

            newObj.AddVelocity(20 * _fDT, 0, 1);
            anyMove = true;
        }

        if (Input.IsKeyDown(40)) {

            newObj.AddVelocity(0, -20 * _fDT, 1);
            anyMove = true;
        }

        if (!anyMove)
            newObj.SetVelocity(0, 0);

        if (Input.GetTouchCount() > 0) {
            var touch = Input.GetTouch(0);
            var gamePoint = window.engine.Renderer.ScreenToGamePoint(touch.x, 1 - touch.y);
            gamePoint.y += 6.4 + 3.2;
            var toPoint = gamePoint.sub(newObj.GetPosition());
            toPoint.clampLength(-1, 1);
            newObj.AddVelocity(toPoint.x, toPoint.y);
        }
        
        fireTimer += _fDT;
        
        if( Input.IsKeyDown(90) || Input.GetTouchCount() > 0 ) {
            if( fireTimer > 0.5 ) {
                
                var newBullet = window.engine.GameManager.SpawnObject( "p-bullet" );
                var sourcePos = newObj.GetPosition();
                newBullet.SetPosition( sourcePos.x, sourcePos.y + 1 );
                fireTimer = 0;
            }
        }
        
        newObj.m_3DObject.rotation.y = newObj.GetVelocity().x * 0.75;
        newObj.m_3DObject.rotation.x = newObj.GetVelocity().y * -0.75;
    });

    newObj.AddCollisionCallback(function(_otherObj) {
        
    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("p-bullet", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("p-bullet"));
    
    var deathTimer = 0;
    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity( 0, 2);
        deathTimer += _fDT;
        if( deathTimer > 4)
            newObj.Destroy();
    });
    
    newObj.AddCollisionCallback(function(_otherObj) {
        newObj.Destroy();
    });
    
    return newObj;
});

window.engine.GameManager.AddObjectFunction("debris", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("debris"));

    _d3Object.rotation.x = 3.14;

    newObj.AddUpdateCallback(function(_fDT) {

        _d3Object.rotation.x += 3.14 / 4.321 * _fDT;
        _d3Object.rotation.y += 3.14 / 5.4321 * _fDT;

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("right-barrier", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("right-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = window.engine.Renderer.ScreenToGamePoint(1, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x + 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("left-barrier", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("left-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var gamePoint = window.engine.Renderer.ScreenToGamePoint(0, 0.5);
        if (gamePoint) {
            newObj.SetPosition(gamePoint.x - 1, gamePoint.y);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("bottom-barrier", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("bottom-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = window.engine.Renderer.ScreenToGamePoint(0, 0);
        var rightPoint = window.engine.Renderer.ScreenToGamePoint(1, 0);
        if (leftPoint && rightPoint) {
            var width = leftPoint.distanceTo( rightPoint );
            
            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;
            
            newObj.SetPosition(( leftPoint.x + rightPoint.x ) / 2, leftPoint.y - 1);
            newObj.SetVelocity(0, 0);
        }

    });

    return newObj;
});

window.engine.GameManager.AddObjectFunction("top-barrier", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("top-barrier"));

    newObj.AddUpdateCallback(function(_fDT) {
        var leftPoint = window.engine.Renderer.ScreenToGamePoint(0, 1);
        var rightPoint = window.engine.Renderer.ScreenToGamePoint(1, 1);
        if (leftPoint && rightPoint) {
            var width = leftPoint.distanceTo( rightPoint );
            
            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;
            
            newObj.SetPosition(( leftPoint.x + rightPoint.x ) / 2, leftPoint.y + 1);
            newObj.SetVelocity(0, 0);
        }
    });

    return newObj;
});