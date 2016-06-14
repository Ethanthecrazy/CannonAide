window.engine.GameManager.AddObjectFunction("player", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("player"));

    newObj.m_nHealth = 3;
    var counterRecharge = 0;
    var counterTimer = 0;

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
            gamePoint.y += 108 / window.innerHeight * 64;
            var toPoint = gamePoint.sub(newObj.GetPosition());
            toPoint.clampLength(-1.5, 1.5);
            newObj.AddVelocity(toPoint.x, toPoint.y);
            touchLastFrame = true;
            counterRecharge += _fDT;
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
                newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y + 2 + sourceVel.y);
                fireTimer = 0;
            }
        }

        newObj.m_3DObject.rotation.y = newObj.GetVelocity().x * 0.5;
        newObj.m_3DObject.rotation.x = newObj.GetVelocity().y * -0.5;

        counterTimer += _fDT;

        if (newObj.m_timeSinceDamage < 0.25) {
            var vecLoc = new THREE.Vector3(0.3, 0, 0);
            var angle = THREE.Math.randFloat(0, 3.14 * 2);
            vecLoc.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
            newObj.m_3DObject.position.x += vecLoc.x;
            newObj.m_3DObject.position.y += vecLoc.y;
        }
        
        if (newObj.m_timeSinceDamage < 0.1) {
            this.m_3DObject.children[0].material.color = new THREE.Color(2, 2, 2);
        }
        else {
            this.m_3DObject.children[0].material.color = new THREE.Color(1, 1, 1);
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
        if (counterTimer <= 0.5) {
            var newBullet = window.engine.GameManager.SpawnObject("p-counter-bullet");
            var sourcePos = newObj.GetPosition();
            var sourceVel = newObj.GetVelocity();
            newBullet.SetPosition(sourcePos.x + sourceVel.x, sourcePos.y + 1 + sourceVel.y);
            newBullet.damageAmount = _amount * 3;
        }
        else if( newObj.m_timeSinceDamage > 0.25 ){
            oldDamage(_amount);
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

    AddDestroyParticle(newObj, "part-spark", 16, 0.25, 0.6, 1.5);

    return newObj;
});

window.engine.GameManager.AddObjectFunction("p-counter-bullet", function(_gameObject, _d3Object) {

    var newObj = _gameObject || new GameObject(_d3Object, window.engine.GameManager.GetColliders("p-counter-bullet"));

    newObj.AddUpdateCallback(function(_fDT) {
        newObj.SetVelocity(0, 3);
    });

    AddTimeout(newObj, 3);

    newObj.AddCollisionCallback(function(_otherObj) {
        if (newObj.damageAmount)
            _otherObj.parent.Damage(newObj.damageAmount);
    });

    return newObj;
});