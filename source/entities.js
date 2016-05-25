/* global GameObject */

window.engine.GameManager.AddObjectFunction( "humanoid", function( _d3Object ){
    
    var newObj = new GameObject( _d3Object, window.engine.GameManager.GetColliders( "humanoid" ) );
    
    _d3Object.rotation.x = 3.14;
    
    newObj.AddUpdateCallback( function( _fDT ) {
       
    });
    
    newObj.AddCollisionCallback( function( _otherObj ){

    });
    
    window.addEventListener("keydown", function (e) {
        e = e || window.event;
        
        switch (e.keyCode) {
            case 37:
                newObj.AddVelocity( -0.54321, 0 );
                break;
            case 38:
                newObj.AddVelocity( 0, 0.54321 );
                break;
            case 39:
                newObj.AddVelocity( 0.54321, 0 );
                break;
            case 40:
                newObj.AddVelocity( 0, -0.54321 );
                break;
        }
    });

   return newObj;
});