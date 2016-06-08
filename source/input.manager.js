//==============================================================================
function InputManager() {
    this.m_currKeyStates = Array.apply(null, Array(256)).map(Boolean.prototype.valueOf, false);
    this.m_currTouches = [];
}

InputManager.prototype.Init = function( _canvas ) {
        // Keyboard interface
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));

    // Touch interface
    window.addEventListener("touchstart", this.handleTouch.bind(this));
    window.addEventListener("touchmove", this.handleTouch.bind(this));
    window.addEventListener("touchend", this.handleTouch.bind(this));

    // Mouse emulates a touch
    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
};

//==============================================================================
InputManager.prototype.onKeyDown = function(e) {
    e = e || window.event;
    e.preventDefault();

    this.m_currKeyStates[e.keyCode] = true;
};

//==============================================================================
InputManager.prototype.onKeyUp = function(e) {
    e = e || window.event;
    e.preventDefault();

    this.m_currKeyStates[e.keyCode] = false;
};

//==============================================================================
InputManager.prototype.handleTouch = function(e) {


    e = e || window.event;
    e.preventDefault();
        
    this.m_currTouches = [];
        
    for (var i = 0; i < e.touches.length; ++i) {
        var currTouch = e.touches.item(i);
        this.m_currTouches.push({
            x: currTouch.clientX / window.innerWidth,
            y: currTouch.clientY / window.innerHeight,
            id: currTouch.identifier
        });
    }
};

//==============================================================================
InputManager.prototype.GenerateMouseTouch = function(e) {
    
    var touchX = e.clientX / window.innerWidth;
    var touchY = e.clientY / window.innerHeight;
    
    if( touchX > 1 )
        touchX = 1;
    if( touchX < 0 )
        touchX = 0;
    if( touchY > 1 )
        touchY = 1;
    if( touchY < 0 )
        touchY = 0;
        
    return {
        x: touchX,
        y: touchY,
        id: 0
    };
};

//==============================================================================
InputManager.prototype.onMouseDown = function(e) {
    e = e || window.event;
    e.preventDefault();

    this.m_currTouches[0] = this.GenerateMouseTouch(e);
};

//==============================================================================
InputManager.prototype.onMouseMove = function(e) {
    e = e || window.event;
    e.preventDefault();

    if (this.m_currTouches[0]) {
        this.m_currTouches[0] = this.GenerateMouseTouch(e);
    }
};

//==============================================================================
InputManager.prototype.onMouseUp = function(e) {
    e = e || window.event;
    e.preventDefault();

    this.m_currTouches.splice(0, 1);
};

//==============================================================================
InputManager.prototype.IsKeyDown = function(_id) {
    return this.m_currKeyStates[_id];
};

//==============================================================================
InputManager.prototype.IsKeyPressed = function(_id) {
    return this.m_currKeyStates[_id] && !this.m_prevKeyStates[_id];
};

//==============================================================================
InputManager.prototype.IsKeyReleased = function(_id) {
    return !this.m_currKeyStates[_id] && this.m_prevKeyStates[_id];
};

//==============================================================================
InputManager.prototype.GetTouchCount = function() {
    return this.m_currTouches.length;
};

InputManager.prototype.GetTouch = function(_idx) {

    var returnVal = null;
    var nItrCount = 0;
    this.m_currTouches.forEach(function(currTouch) {
        if (nItrCount == _idx)
            returnVal = currTouch;

        nItrCount++;
    });

    return returnVal;
};

if (!window.engine)
    window.engine = {};

window.engine.InputManager = new InputManager();