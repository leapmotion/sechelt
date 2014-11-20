// Ported from https://developer.leapmotion.com/gallery/leap-motion-vr-intro
// by @pehrlich and @jhe
Leap.plugin( 'flyControls', function(scope){

  scope || (scope = {});


  // Takes in a THREE.Object3d
  // Sets the position and orientation
  // according to hand gestures.
  // Returns true if updated, false if no update.
  this.updateCameraFromFlyingControls = function(object3d){

    var frame = this.lastConnectionFrame;
    var hand1 = frame.hands[0];
    var hand2 = frame.hands[1];

    // This is very cludgy right now. Probably should be checking hand handedness, etc.
    if (!hand1 || !hand2) return false;

    // Average to hand positions, for a very rough proof-of-concept.
    var posOffset = new THREE.Vector3();

    posOffset.fromArray(hand1.palmPosition);
    posOffset.add( (new THREE.Vector3).fromArray(hand2.palmPosition) );

    posOffset.divideScalar(2);

    posOffset.y -= 0.15; // Default height 15cm

    object3d.position.add(posOffset);

  };

  return {}

});