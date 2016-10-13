var THREE = require("../lib/three.js");
var GameManager = require("../game.manager.js").Instance();

var util = {};

util.AddTimeout = function(_gameObject, _time) {

    var deathTimer = 0;
    _gameObject.AddUpdateCallback(function(_fDT) {
        deathTimer += _fDT;
        if (deathTimer > _time)
            GameManager.Destroy(_gameObject, true);
    });
};

util.AddScaleOverTime = function(_gameObject, _minScale, _maxScale, _duration) {

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
};

util.AddDestroyParticle = function(_gameObject, _matName, _count, _duration, _startScale, _stopScale) {

    _gameObject.AddDestroyCallback(function() {

        var pos = _gameObject.GetPosition();
        var radCount = 0;
        for (var i = 0; i < _count; ++i) {

            var objSprite = GameManager.SpawnObject(_matName, true);
            objSprite.SetPosition(pos.x, pos.y);

            radCount += THREE.Math.randFloat(0, 3.14 / 2);
            var vecDir = new THREE.Vector3(1, 0, 0);
            vecDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), radCount);
            vecDir.multiplyScalar(THREE.Math.randFloat(0.05, 0.25));

            objSprite.m_3DObject.rotation.z = THREE.Math.randFloat(0, 3.14 * 2);

            objSprite.SetVelocity(vecDir.x, vecDir.y);
            util.AddTimeout(objSprite, _duration);
            util.AddScaleOverTime(objSprite, _startScale, _stopScale, _duration);
        }
    });
};

module.exports = util;