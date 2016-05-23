/* global GameObject */

window.engine.GameManager.AddObjectFunction( "humanoid", function( _d3Object ){
    var newObj = new GameObject( _d3Object, [] );
    
    _d3Object.rotation.y = -3.14 / 2;
    _d3Object.rotation.x = 3.14;
    newObj.SetVelocity( 0, 0.5);
    
    var fpsCounter = 0;
    var fpsTimer = 0;
    
    newObj.AddUpdateCallback( function( _fDT ) {
       if( newObj.GetPosition().y > 35 ) {
           newObj.SetPosition( 0, -40 );
       }
       
       fpsCounter++;
       fpsTimer += _fDT;
       if( fpsTimer > 1 ) {
           console.log( fpsCounter );
           fpsCounter = 0;
           fpsTimer = 0;
       }
    });
    
   return newObj;
});