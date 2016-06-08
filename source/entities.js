/* global GameObject */
/* global THREE */

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

window.engine.GameManager.AddObjectFunction("player", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("player"));

    newObj.m_nHealth = 3;
    var counterRecharge = 0;
    var counterTimer = 0;
    var shakeTimer = 10;

    var fireTimer = 1;
    var entranceTimer = 0;
    var touchLastFrame = false;

    newObj.AddUpdateCallback(function(_fDT) {

        var botRatio = THREE.Math.smootherstep(counterRecharge, 0, 5 / 3);
        newObj.m_3DObject.children[1].material.color = new THREE.Color(0.1 * botRatio, 0.2 * botRatio, 0.3 * botRatio);

        var midRatio = THREE.Math.smootherstep(counterRecharge, 5 / 3, 5 / 3 * 2);
        newObj.m_3DObject.children[2].material.color = new THREE.Color(0.2 * midRatio, 0.4 * midRatio, 0.6 * midRatio);

        var topRatio = THREE.Math.smootherstep(counterRecharge, 5 / 3 * 2, 5);
        newObj.m_3DObject.children[3].material.color = new THREE.Color(0.3 * topRatio, 0.6 * topRatio, 0.9 * topRatio);

        if (entranceTimer < 1.5) {

            entranceTimer += _fDT;
            var percent = THREE.Math.smootherstep(entranceTimer, 0, 1.5);
            newObj.SetPosition(0, -40 + percent * 24);
            newObj.SetVelocity(0, 0);
            return;
        }

        var anyMove = false;

        if (g_InputManager.IsKeyDown(37)) {

            newObj.AddVelocity(-20 * _fDT, 0, 1);
            anyMove = true;
        }

        if (g_InputManager.IsKeyDown(38)) {

            newObj.AddVelocity(0, 20 * _fDT, 1);
            anyMove = true;

        }

        if (g_InputManager.IsKeyDown(39)) {

            newObj.AddVelocity(20 * _fDT, 0, 1);
            anyMove = true;
        }

        if (g_InputManager.IsKeyDown(40)) {

            newObj.AddVelocity(0, -20 * _fDT, 1);
            anyMove = true;
        }

        if (!anyMove)
            newObj.SetVelocity(0, 0);

        if (g_InputManager.GetTouchCount() > 0) {

            var touch = g_InputManager.GetTouch(0);
            var gamePoint = window.engine.Renderer.ScreenToGamePoint(touch.x, 1 - touch.y);
            gamePoint.y += 6.4 + 3.2;
            var toPoint = gamePoint.sub(newObj.GetPosition());
            toPoint.clampLength(-1.5, 1.5);
            newObj.AddVelocity(toPoint.x, toPoint.y);
            touchLastFrame = true;
        }
        else {

            if (counterRecharge > 5 && touchLastFrame == true) {
                counterRecharge = 0;
                counterTimer = 0;
            }

            touchLastFrame = false;
        }

        fireTimer += _fDT;

        if (g_InputManager.IsKeyDown(90) || g_InputManager.GetTouchCount() > 0) {
            if (fireTimer > 0.25) {

                var newBullet = window.engine.GameManager.SpawnObject("p-bullet");
                var sourcePos = newObj.GetPosition();
                var sourceVel = newObj.GetVelocity();
                newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y + 1 + sourceVel.y);
                fireTimer = 0;
            }
        }

        newObj.m_3DObject.rotation.y = newObj.GetVelocity().x * 0.5;
        newObj.m_3DObject.rotation.x = newObj.GetVelocity().y * -0.5;


        counterRecharge += _fDT;
        counterTimer += _fDT;

        shakeTimer += _fDT;

        if (shakeTimer < 0.25) {
            var vecLoc = new THREE.Vector3(0.1, 0, 0);
            var angle = THREE.Math.randFloat(0, 3.14 * 2);
            vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
            newObj.m_3DObject.position.x += vecLoc.x;
            newObj.m_3DObject.position.y += vecLoc.y;
        }
    });

    newObj.AddCollisionCallback(function(_otherObj) {

        if (_otherObj.layer == "e-bullet" && counterTimer < 0.5) {
            var newBullet = window.engine.GameManager.SpawnObject("p-counter-bullet");
            var sourcePos = _otherObj.parent.GetPosition();
            var sourceVel = newObj.GetVelocity();
            newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y + 1 + sourceVel.y);
            newBullet.damageAmount = 3;
        }
    });

    AddDestroyParticle(newObj, "sprite-test", 32, 2, 1, 8);

    newObj.AddDestroyCallback(function() {
        setTimeout(function() {
            g_GameManager.DestroyAll();
            g_GameManager.SpawnObject("AideGame");
        }, 3000);

    });

    var oldDamage = newObj.Damage.bind(newObj);
    newObj.Damage = function(_amount) {
        if (counterTimer > 0.5) {
            oldDamage(_amount);
            shakeTimer = 0;
        }
    };

    newObj.m_3DObject.children[1].position.z = 0.3;
    newObj.m_3DObject.children[2].position.z = 0.2;
    newObj.m_3DObject.children[3].position.z = 0.1;
    return newObj;
});

window.engine.GameManager.AddObjectFunction("p-bullet", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("p-bullet"));

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity(0, 2);
    });

    AddTimeout(newObj, 2);

    newObj.AddCollisionCallback(function(_otherObj) {
        _otherObj.parent.Damage(1);
        g_GameManager.Destroy(newObj);
    });

    AddDestroyParticle(newObj, "part-spark", 16, 0.25, 0.6, 1.2);

    return newObj;
});

window.engine.GameManager.AddObjectFunction("p-counter-bullet", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("p-counter-bullet"));

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity(0, 0);
    });

    AddTimeout(newObj, 0.5);

    newObj.AddCollisionCallback(function(_otherObj) {
        if (newObj.damageAmount)
            _otherObj.parent.Damage(newObj.damageAmount);
    });

    return newObj;
});
window.engine.GameManager.AddObjectFunction("debris", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("debris"));

    _d3Object.rotation.x = 3.14;
    newObj.m_nHealth = 1;

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

window.engine.GameManager.AddObjectFunction("e-bullet", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("e-bullet"));

    newObj.m_3DObject.rotation.z = 3.14;
    newObj.m_nHealth = 1;

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity(0, -1);
    });

    AddTimeout(newObj, 4);

    newObj.AddCollisionCallback(function(_otherObj) {
        _otherObj.parent.Damage(1);
        g_GameManager.Destroy(newObj);
    });

    AddDestroyParticle(newObj, "part-spark", 16, 0.25, 0.6, 1.2);

    return newObj;
});

var sphereRows = [];
sphereRows[0] = [];
sphereRows[1] = [];
sphereRows[2] = [];
sphereRows[3] = [];
sphereRows[4] = [];

window.engine.GameManager.AddObjectFunction("sphere", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("sphere"));

    newObj.m_nHealth = 3;
    var fireTimer = 0;
    var mode = "left";
    var rowIndex = -1;

    for (var i = 0; i < sphereRows.length; ++i) {
        var currRow = sphereRows[i];

        for (var n = 0; n < sphereRows.length; ++n) {
            var checkRow = sphereRows[n];

            if (currRow.length < checkRow.length) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex > -1)
            break;
    }

    if (rowIndex < 0)
        rowIndex = sphereRows.length - 1;

    sphereRows[rowIndex].push(newObj);

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.m_3DObject.rotation.y += _fDT;

        fireTimer += _fDT;
        if (fireTimer > 3) {

            var newBullet = window.engine.GameManager.SpawnObject("e-bullet");
            var sourcePos = newObj.GetPosition();
            var sourceVel = newObj.GetVelocity();
            newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y - 0.5 + sourceVel.y);
            fireTimer = 0;
        }

        var bottomLeft = window.engine.Renderer.ScreenToGamePoint(0, 0.1);
        var topRight = window.engine.Renderer.ScreenToGamePoint(1, 0.9);
        if (bottomLeft && topRight) {

            var objPos = newObj.GetPosition();
            var targetY = 6 * (rowIndex + 1);

            if (objPos.y - 0.5 > targetY) {
                newObj.AddVelocity(0, -1 * _fDT);
            }
            else if (objPos.y + 0.5 < targetY) {
                newObj.AddVelocity(0, 1 * _fDT);
            }
            else {
                if (objPos.x - 0.5 < bottomLeft.x + 3) {
                    mode = "right";
                }
                if (objPos.x + 0.5 > topRight.x - 3) {
                    mode = "left";
                }

                if (mode == "left") {
                    newObj.AddVelocity(-0.5 * _fDT, 0);
                }
                else {
                    newObj.AddVelocity(0.5 * _fDT, 0);
                }
            }

            var vel = newObj.GetVelocity();
            vel.clampLength(-0.25, 0.25);
            newObj.SetVelocity(vel.x, vel.y);
        }
    });

    newObj.AddDestroyCallback(function() {
        sphereRows[rowIndex].splice(sphereRows[rowIndex].indexOf(newObj), 1);
    });

    AddDestroyParticle(newObj, "sprite-test", 16, 0.5, 1, 2);

    return newObj;
});

window.engine.GameManager.AddObjectFunction("mega-sphere", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("mega-sphere"));

    var sphereCount = 3;

    for (var i = 0; i < sphereCount; ++i) {

        var vecLoc = new THREE.Vector3(0, 1, 0);

        var angle = 3.14 * 2 / 3 * i;
        vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);

        newObj.m_3DObject.children[i].position.set(vecLoc.x, vecLoc.y, 0);
    }


    newObj.m_nHealth = 6;
    var mode = "left";
    newObj.AddUpdateCallback(function(_fDT) {
        newObj.m_3DObject.rotation.z += _fDT;

        var bottomLeft = window.engine.Renderer.ScreenToGamePoint(0, 0.1);
        var topRight = window.engine.Renderer.ScreenToGamePoint(1, 0.9);
        if (bottomLeft && topRight) {

            var objPos = newObj.GetPosition();

            if (objPos.y + 0.5 > topRight.y) {
                newObj.AddVelocity(0, -1 * _fDT);
            }
            else if (objPos.y - 0.5 < 0) {
                newObj.AddVelocity(0, 1 * _fDT);
            }
            else {
                if (objPos.x - 0.5 < bottomLeft.x + 7) {
                    mode = "right";
                }
                if (objPos.x + 0.5 > topRight.x - 7) {
                    mode = "left";
                }

                if (mode == "left") {
                    newObj.AddVelocity(-0.5 * _fDT, 0);
                }
                else {
                    newObj.AddVelocity(0.5 * _fDT, 0);
                }

                var vel = newObj.GetVelocity();
                vel.clampLength(-0.25, 0.25);
                newObj.SetVelocity(vel.x, vel.y);
            }
        }
    });

    newObj.AddDestroyCallback(function() {

        var sphereCount = 3;

        for (var i = 0; i < sphereCount; ++i) {

            var worldPos = newObj.m_3DObject.children[i].position.clone();
            newObj.m_3DObject.children[i].localToWorld(worldPos);

            g_GameManager.SpawnObject("sphere").SetPosition(worldPos.x, worldPos.y);
        }

    });

    AddDestroyParticle(newObj, "sprite-test", 16, 0.66, 1, 2);

    return newObj;

});