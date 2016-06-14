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
        newObj.m_3DObject.rotation.x += _fDT;
        newObj.m_3DObject.rotation.y += _fDT * 1.0321;
        newObj.m_3DObject.rotation.z += _fDT * 0.5945;

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

        if (newObj.m_timeSinceDamage < 0.1) {
            this.m_3DObject.children[0].material.color = new THREE.Color(2, 2, 2);
        }
        else {
            this.m_3DObject.children[0].material.color = new THREE.Color(1, 1, 1);
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

        var vecLoc = new THREE.Vector3(0, 1.5, 0);

        var angle = 3.14 * 2 / 3 * i;
        vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);

        newObj.m_3DObject.children[i].position.set(vecLoc.x, vecLoc.y, 0);
        newObj.m_3DObject.children[i].rotation.x = THREE.Math.randFloat(0, 3.14);
        newObj.m_3DObject.children[i].rotation.y = THREE.Math.randFloat(0, 3.14);
        newObj.m_3DObject.children[i].rotation.z = THREE.Math.randFloat(0, 3.14);
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