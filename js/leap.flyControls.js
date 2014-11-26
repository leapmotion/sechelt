// Ported from https://developer.leapmotion.com/gallery/leap-motion-vr-intro
// by @pehrlich and @jhe
// See original source, here:
// https://github.com/leapmotion/VRIntro/blob/master/source/VRIntroLib/FlyingLayer.cpp#L37
Leap.plugin( 'flyControls', function(scope){

  scope || (scope = {});

  //scope.PERIOD_TRANS = 0.00045;
  scope.PERIOD_TRANS = 0.0001; // inverse velocity
  scope.PERIOD_ROT = 0.1; // inverse rotational velocity
  scope.FILTER = 0.2;
  scope.MAX_VELOCITY_SQNORM = 0.2;
  scope.MAX_ROTATION_SQNORM = 1.0;

  var lastTime;


  var frame;
  var velocityCtrl = new THREE.Vector3;
  var angVelocityCtrl = new THREE.Quaternion;

  var addQuats = function(a, b){
    a.x += b.x;
    a.y += b.y;
    a.z += b.z;
    a.w += b.w;
  };

  // Takes in a THREE.Object3d
  // Sets the position and orientation
  // according to hand gestures.
  // Returns true if updated, false if no update.
  this.updateCameraFromFlyingControls = function(dolly, camera, time){
    var dt;

    if (lastTime) {
      dt = 0.001 * (time - lastTime);
    } else {
      dt = 0;
    }

    lastTime = time;

    //if (this.lastConnectionFrame.data && this.lastConnectionFrame.data.transformed) frame = this.lastConnectionFrame;
    //if (!frame) return;

    if (!this.lastConnectionFrame.valid) return;

    frame = this.lastConnectionFrame;

    var handPosRel = [];
    var posAccum = new THREE.Vector3;
    var rotAccum = new THREE.Quaternion(0,0,0,0);

    var numHands = frame.hands.length;

    if (numHands > 0) {
      var offset = (new THREE.Vector3(0, -0.15, 0.03));

      for (var i = 0; i < numHands; i++) {
        //handPosRel[i] = (new THREE.Vector3).fromArray(frame.hands[i].palmPosition).applyMatrix4(invMatrixCamera);
        handPosRel[i] = (new THREE.Vector3).fromArray(frame.hands[i].palmPosition).applyMatrix4(window.cachedMatrixInv);
        handPosRel[i].sub(offset);
        //var handPosAbs = handPosRel[i].clone().applyMatrix4(camera.matrix);
        var handPosAbs = handPosRel[i].clone().applyMatrix4(window.cachedMatrix); // dolly space hand position

        posAccum.add(handPosAbs);

        addQuats(
          rotAccum,
          (new THREE.Quaternion).setFromUnitVectors(
            new THREE.Vector3(0, 0, -1),
            handPosRel[i].clone().normalize()
          )
        );

      }

      if (numHands == 2) {
        var fromVec = new THREE.Vector3(
          handPosRel[0].x < handPosRel[1].x ? 1 : -1,
          0,
          0
        );
        var q = (new THREE.Quaternion).setFromUnitVectors(fromVec, handPosRel[1].clone().sub(handPosRel[0]) );
        addQuats(rotAccum,q);
        addQuats(rotAccum,q);
        addQuats(rotAccum,q);
        addQuats(rotAccum,q);
        addQuats(rotAccum,q);
      }
      rotAccum.normalize();

      velocityCtrl.lerp(posAccum.multiplyScalar( 1 / numHands), scope.FILTER);
      angVelocityCtrl.slerp(rotAccum, scope.FILTER);

    } else {

      velocityCtrl.lerp(     new THREE.Vector3(0, 0, 0), 0.3 * scope.FILTER );
      angVelocityCtrl.slerp( new THREE.Quaternion(0, 0, 0, 1), 0.3 * scope.FILTER );
    }

    var deltaPos = velocityCtrl.clone().multiplyScalar(
      Math.min(
        scope.MAX_VELOCITY_SQNORM,
        velocityCtrl.lengthSq()
      ) * dt / scope.PERIOD_TRANS
    );
    var deltaRot = (new THREE.Quaternion(0, 0, 0, 1)).slerp(
      angVelocityCtrl,
      Math.min(
        scope.MAX_ROTATION_SQNORM,
        Math.pow(Math.acos(angVelocityCtrl.w)*2, 2)
      ) * dt / scope.PERIOD_ROT
    );


    dolly.quaternion.multiply(deltaRot);
    dolly.position.add(deltaPos.applyQuaternion(dolly.quaternion));

  };

  return {}

});