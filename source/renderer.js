/* global THREE */
/* global $ */

function Renderer() {

    this.m_3Scene = new THREE.Scene();
    this.m_3Plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.m_3Raycaster = new THREE.Raycaster();

    // Startup the loading manager
    this.m_3LoadManager = new THREE.LoadingManager();
    this.m_3LoadManager.onProgress = function(item, loaded, total) {
        console.log(item, loaded, total);
    };

    this.m_3Scene.add(new THREE.AmbientLight(0x101030));

    var directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1);
    this.m_3Scene.add(directionalLight);

    // Start up the geometry loader
    this.m_3OBJLoader = new THREE.OBJLoader(this.m_3LoadManager);
    this.m_3Textureloader = new THREE.TextureLoader(this.m_3LoadManager);

    this.m_3Geos = {};
    this.m_3Textures = {};
    this.m_3Materials = {};
    this.m_3RenderObjects = {};
}

//==============================================================================
Renderer.prototype.Init = function(canvas) {

    var setWidth = window.innerWidth;
    var setHeight = window.innerHeight;

    var unitsWidth = 64 * (setWidth / setHeight);
    var unitsHeight = 64;

    this.m_3Camera = new THREE.OrthographicCamera(
        unitsWidth / -2,
        unitsWidth / 2,
        unitsHeight / 2,
        unitsHeight / -2,
        1,
        1000);

    this.m_3Camera.position.z = 500;

    this.m_3Renderer = new THREE.WebGLRenderer({
        canvas: canvas
    });

    this.m_3Renderer.setPixelRatio(window.devicePixelRatio);
    this.m_3Renderer.setSize(setWidth, setHeight);
    this.m_3Renderer.setClearColor(0x000000);

    window.onresize = function() {
        this.onResize(window.innerWidth, window.innerHeight);
    }.bind(this);
};

//==============================================================================
Renderer.prototype.onResize = function(_nWidth, _nHeight) {

    var unitsWidth = 64 * (_nWidth / _nHeight);
    var unitsHeight = 64;

    this.m_3Camera.left = unitsWidth / -2;
    this.m_3Camera.right = unitsWidth / 2;
    this.m_3Camera.top = unitsHeight / 2;
    this.m_3Camera.bottom = unitsHeight / -2;

    this.m_3Camera.updateProjectionMatrix();

    this.m_3Renderer.setSize(_nWidth, _nHeight);
};

//==============================================================================
Renderer.prototype.GetGameDimensions = function() {
    return new THREE.Vector2(this.m_3Camera.right * 2, this.m_3Camera.top * 2);
};

//==============================================================================
Renderer.prototype.Load = function(_path) {
    var that = this;
    $.getJSON(_path, function(_Index) {

        var loadMeshes = _Index["meshes"];
        for (var meshName in loadMeshes) {
            that.LoadGeometry(meshName, loadMeshes[meshName]);
        }

        var loadMaterials = _Index["materials"];
        for (var matName in loadMaterials) {
            var currMat = loadMaterials[matName];

            if (currMat["params"] && currMat["params"]["map"]) {
                that.LoadTexture(currMat["params"]["map"]);
            }
        }

        that.m_3LoadManager.onLoad = function() {
            this.CreateMaterials(_Index["materials"]);
            this.onLoad();
        }.bind(that);

    }).fail(function() {
        console.log("Failed to load '" + _path + "'.");
    });
};

//==============================================================================
Renderer.prototype.LoadTexture = function(_path) {

    if (this.m_3Textures[_path] != null) {
        return;
    }

    var that = this;
    this.m_3Textureloader.load("resources/" + _path, function(texture) {

        that.m_3Textures[_path] = texture;

    }, this.onProgress, this.onError);
    
    this.m_3Textures[_path] = true;
};

//==============================================================================
Renderer.prototype.CreateMaterials = function(_matDefs) {

    for (var matName in _matDefs) {
        var currMat = _matDefs[matName];

        if (!THREE[currMat["type"]]) {
            console.log("Could not locate '" + currMat["type"] + "' material.");
            continue;
        }

        currMat["params"]["map"] = this.m_3Textures[currMat["params"]["map"]];
        this.m_3Materials[matName] = new THREE[currMat["type"]](currMat["params"]);
    }
};

//==============================================================================
Renderer.prototype.LoadGeometry = function(_name, _path) {

    if (this.m_3Geos[_path] != null) {
        return;
    }

    var that = this;
    this.m_3OBJLoader.load("resources/" + _path, function(object) {

        object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
                that.m_3Geos[_name] = child.geometry;
            }
        });

    }, this.onProgress, this.onError);

    this.m_3Geos[_path] = "loading";
};

//==============================================================================
Renderer.prototype.onProgress = function(xhr) {
    if (xhr.lengthComputable) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete, 2) + '% downloaded');
    }
};

//==============================================================================
Renderer.prototype.onError = function(xhr) {

};

// empty default just to have it exist
//==============================================================================
Renderer.prototype.onload = function() {

};

//==============================================================================
Renderer.prototype.Render = function() {

    // Handled queued camera movement
    //this.m_3Camera.position.x += this.m_fCameraMoveX;
    //this.m_3Camera.position.z += this.m_fCameraMoveZ;
    //this.m_3Camera.updateProjectionMatrix();

    //this.m_fCameraMoveX = 0.0;
    //this.m_fCameraMoveZ = 0.0;

    this.m_3Renderer.render(this.m_3Scene, this.m_3Camera);
};

//==============================================================================
Renderer.prototype.CreateRenderObject = function(_geoName, _texName) {

    var sourceMat = this.m_3Materials[_texName];
    var sourceGeo = this.m_3Geos[_geoName];
        
    if (!sourceMat) {
        sourceMat = new THREE.MeshNormalMaterial();
        if( _texName ) {
            console.log( "Could not find a material called '" + _texName + "'." );
        }
    }
    
    var newObject = new THREE.Object3D();
    
    if( sourceMat instanceof THREE.SpriteMaterial ) {
        var newSprite = new THREE.Sprite( sourceMat.clone() );
        newSprite.position.z = 16;
        newObject.add( newSprite );
    }
    else if( sourceGeo ) {
        newObject.add(new THREE.Mesh(sourceGeo, sourceMat));
    }
    
    /*var material = new THREE.LineBasicMaterial({
        color: 0xffffff
    });

    if (sourceObject.colliders) {
        sourceObject.colliders.forEach(function(curr, index, array) {

            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(curr.left, curr.top, 0),
                new THREE.Vector3(curr.right, curr.top, 0),
                new THREE.Vector3(curr.right, curr.bottom, 0),
                new THREE.Vector3(curr.left, curr.bottom, 0),
                new THREE.Vector3(curr.left, curr.top, 0)
            );

            var line = new THREE.Line(geometry, material);
            newObject.add(line);
        });
    }*/

    this.m_3Scene.add(newObject);
    return newObject;
};

//==============================================================================
Renderer.prototype.Remove3DObject = function(_object) {
    this.m_3Scene.remove(_object);
};

//==============================================================================
// Order is: BotLeft, TopLeft, TopRight, BotRight
Renderer.prototype.GetCameraWorldCorners = function() {

    var corners = [];

    corners.push(this.ScreenToGamePoint(-1, -1));
    corners.push(this.ScreenToGamePoint(-1, 1));
    corners.push(this.ScreenToGamePoint(1, 1));
    corners.push(this.ScreenToGamePoint(1, -1));
    return corners;
};

//==============================================================================
Renderer.prototype.ScreenToGamePoint = function(_fScreenPosX, _fScreenPosY) {
    var vRelativePoint = new THREE.Vector2((_fScreenPosX - 0.5) * 2, (_fScreenPosY - 0.5) * 2);
    this.m_3Raycaster.setFromCamera(vRelativePoint, this.m_3Camera);
    var threeIntersect = this.m_3Raycaster.ray.intersectPlane(this.m_3Plane);
    if (threeIntersect)
        return new THREE.Vector2(threeIntersect.x, threeIntersect.y);
    else
        return null;
};

if (!window.engine)
    window.engine = {};

window.engine.Renderer = new Renderer();