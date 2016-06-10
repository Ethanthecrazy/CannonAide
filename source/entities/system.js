var g_GameManager = window.engine.GameManager;
var g_InputManager = window.engine.InputManager;
var g_Player = null;

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

window.engine.GameManager.AddObjectFunction("AideGame", function(_gameObject, _d3Object) {

    var newObj = new GameObject(null, []);

    g_GameManager.SpawnObject("left-barrier");
    g_GameManager.SpawnObject("right-barrier");
    g_GameManager.SpawnObject("bottom-barrier");
    g_GameManager.SpawnObject("top-barrier");

    g_Player = g_GameManager.SpawnObject("player");

    var fSpawnTimer = 0;
    newObj.AddUpdateCallback(function(_fDT) {
        fSpawnTimer += _fDT;
        if (fSpawnTimer > 1) {

            var bottomLeft = window.engine.Renderer.ScreenToGamePoint(0, 0);
            var topRight = window.engine.Renderer.ScreenToGamePoint(1, 1);
            if (bottomLeft && topRight) {
                var vecLoc = null;
                if (Math.abs(bottomLeft.x - topRight.x) > Math.abs(bottomLeft.y - topRight.y)) {
                    vecLoc = new THREE.Vector3(topRight.x + 8, 0, 0);
                }
                else {
                    vecLoc = new THREE.Vector3(topRight.y + 8, 0, 0);
                }

                var angle = THREE.Math.randFloat(0, 3.14);
                vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                g_GameManager.SpawnObject("sphere").SetPosition(vecLoc.x, vecLoc.y);

                fSpawnTimer = 0;
            }
        }
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
            var width = leftPoint.distanceTo(rightPoint);

            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;

            newObj.SetPosition((leftPoint.x + rightPoint.x) / 2, leftPoint.y - 1);
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
            var width = leftPoint.distanceTo(rightPoint);

            newObj.m_3Colliders[0].left = width / -2;
            newObj.m_3Colliders[0].right = width / 2;

            newObj.SetPosition((leftPoint.x + rightPoint.x) / 2, leftPoint.y + 1);
            newObj.SetVelocity(0, 0);
        }
    });

    return newObj;
});