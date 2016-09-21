var THREE = require("../lib/three.js");
var GameManager = require("../game.manager.js").Instance();

var GameObject = require("../gameobject.js");
var Util = require("./util.js");

GameManager.AddObjectFunction("e-bullet", function(_d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("e-bullet"));

    newObj.m_3DObject.rotation.z = 3.14;
    newObj.m_nHealth = 1;

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity(0, -1);
    });

    Util.AddTimeout(newObj, 4);

    newObj.AddCollisionCallback(function(_otherObj) {
        _otherObj.parent.Damage(1);
        GameManager.Destroy(newObj);
    });

    Util.AddDestroyParticle(newObj, "part-spark", 16, 0.25, 0.6, 1.2);

    return newObj;
});

GameManager.AddObjectFunction("sphere", function(_d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("sphere"));

    newObj.m_nHealth = 3;
    var fireTimer = 0;

    newObj.AddUpdateCallback(function(_fDT) {
        //newObj.m_3DObject.rotation.x += _fDT;
        newObj.m_3DObject.rotation.y += _fDT * 1.0321;
        //newObj.m_3DObject.rotation.z += _fDT * 0.5945;

        fireTimer += _fDT;
        if (fireTimer > 3) {

            var newBullet = GameManager.SpawnObject("e-bullet");
            var sourcePos = newObj.GetPosition();
            var sourceVel = newObj.GetVelocity();
            newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y - 0.5 + sourceVel.y);
            fireTimer = 0;
        }

        if (newObj.m_3v2TargetPos) {

            var toPoint = newObj.m_3v2TargetPos.clone().sub(newObj.GetPosition());
            toPoint.clampLength(0, 1);
            toPoint.multiplyScalar(_fDT);
            newObj.AddVelocity(toPoint.x, toPoint.y);
        }

        var vel = newObj.GetVelocity();
        vel.multiplyScalar(0.95);
        newObj.SetVelocity(vel.x, vel.y);

        if (newObj.m_timeSinceDamage < 0.1) {
            this.m_3DObject.children[0].material.color = new THREE.Color(2, 2, 2);
        }
        else {
            this.m_3DObject.children[0].material.color = new THREE.Color(1, 1, 1);
        }

    });

    newObj.AddDestroyCallback(function() {

        var scoreboard = GameManager.GetAllObjects(function(object) {
            if (object.AddScore) {
                return true;
            }
            else {
                return false;
            }
            
        })[0];

        if (scoreboard) {
            scoreboard.AddScore(100);
        }
    });

    Util.AddDestroyParticle(newObj, "sprite-test", 16, 0.5, 1, 2);

    return newObj;
});

GameManager.AddObjectFunction("mega-sphere", function(_d3Object) {

    var newObj = new GameObject(_d3Object, GameManager.GetColliders("mega-sphere"));

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

        var bottomLeft = Renderer.ScreenToGamePoint(0, 0.1);
        var topRight = Renderer.ScreenToGamePoint(1, 0.9);
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

            GameManager.SpawnObject("sphere").SetPosition(worldPos.x, worldPos.y);
        }

    });

    Util.AddDestroyParticle(newObj, "sprite-test", 16, 0.66, 1, 2);

    return newObj;

});