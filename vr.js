/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const VrLib = {};
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    VrLib.frameData = null;
    if (navigator.getVRDisplays) {
      VrLib.frameData = new VRFrameData(); // eslint-disable-line no-undef
    }
    let vrDisplay;
    const btn = document.getElementById('stop-start'); // eslint-disable-line no-undef
    VrLib.normalSceneFrame = null;
    let vrSceneFrame;
    const vrcontrollerIds = [];
    const vrcontrollers = {};

    let b0= false;
    let b1= false;

    let textnotset = true;

    // let dices = null;
/*
    VrLib.setDices = function setDices(d) {
      dices = d;
    };
*/
    VrLib.getControllers = function getControllers() {
      return vrcontrollers;
    };

    VrLib.getControllerIds = function getControllerIds() {
      return vrcontrollerIds;
    };

    window.addEventListener('gamepadconnected', ((e) => {
      // console.log('Gamepad ' + e.gamepad.index + ' connected.');
      vrcontrollers[e.gamepad.index] = {
        position: null,
        radius: 0.05,
        color: [1.0, 1.0, 1.0],
        pressed: false,
        touched: false,
        touch: {
          selectedparticle: null,
          selecteddice: null,
          distance: 2.0
        },
        index: e.gamepad.index,
        dicebutton: false,
        dice2button: false
      };
      let found = false;
      for (let i = 0; i < vrcontrollerIds.length; i++) {
        if (vrcontrollerIds[i] === e.gamepad.index) {
          found = true;
        }
      }
      if (!found) {
        vrcontrollerIds.push(e.gamepad.index);
      }
    }));

/*
    window.addEventListener('gamepaddisconnected', ((e) => {
      //console.log('Gamepad ' + e.gamepad.index + ' disconnected.');
      //setTimeout(removeGamepads, 1000);
    }));
*/

    function vrDown(controller) {
      const cont = controller;
      const pos = controller.position;
      const ori = controller.orientation;
/*
      const dir = new Vec3(0, 0, -2.0);
      const ma = new Matrix4();
      ma.rotationQMatrix(ori);
      const dist = ma.multipleV(dir);
      const ve = [pos[0] + dist.f[0], pos[1] + dist.f[1], pos[2] + dist.f[2]];

      const p2 = new Vec3(pos[0], pos[1], pos[2]);
      const p1 = new Vec3(ve[0], ve[1], ve[2]);

      const closest = null;
      */

      /*
      let d = 0.4 * WallLib.getWallX(); // eslint-disable-line no-undef

      for (let j = 0; j < dices.length; j++) {
        for (let i = 0; i < dices[j].particles.length; i++) {
          const p = dices[j].particles[i];
          const d1 = MSLib.distanceFromPointToLine(p1, p2, p.pos); // eslint-disable-line no-undef
          if (d1 < d) {
            closest = p;
            d = d1;
            cont.selecteddice = dices[j];
          }
        }
      }


      if (closest === null) return;
      cont.selectedparticle = closest;
      let u = p2.subtract(p1);
      const v = p2.subtract(controller.selectedparticle.pos);
      u = u.normalized();
      const px = p2.subtract(u.multiple(u.dot(v)));
      cont.distance = (px.subtract(p2)).length;
      const diff = (px.subtract(p1)).length / (p2.subtract(p1)).length;

      const p3 = new Vec3((p2.f[0] * diff) + (p1.f[0] * (1 - diff)),
                          (p2.f[1] * diff) + (p1.f[1] * (1 - diff)),
                          (p2.f[2] * diff) + (p1.f[2] * (1 - diff)));
      cont.selectedparticle.sleep = false;
      cont.selecteddice.setTouchPoint(p3, controller.selectedparticle, controller.index);
      */
    }

    function vrMove(controller) {
      const pos = controller.position;
      const ori = controller.orientation;
      PlotterLib.setPosition(pos,ori);
      /*
      const cont = controller;
      const pos = controller.position;
      const ori = controller.orientation;
      if (controller.selectedparticle === null) return;
      const dir = new Vec3(0, 0, -2.0);
      const ma = new Matrix4();
      ma.rotationQMatrix(ori);
      const dist = ma.multipleV(dir);
      const v = [pos[0] + dist.f[0], pos[1] + dist.f[1], pos[2] + dist.f[2]];
      const p2 = new Vec3(pos[0], pos[1], pos[2]);
      const p1 = new Vec3(v[0], v[1], v[2]);

      const diff = (controller.distance) / (p1.subtract(p2)).length;
      const p3 = new Vec3((p1.f[0] * diff) + (p2.f[0] * (1 - diff)),
                          (p1.f[1] * diff) + (p2.f[1] * (1 - diff)),
                          (p1.f[2] * diff) + (p2.f[2] * (1 - diff)));
      if (p3.f[0] > WallLib.getWallX()) { // eslint-disable-line no-undef
        p3.f[0] = WallLib.getWallX(); // eslint-disable-line no-undef
      }
      if (p3.f[0] < -WallLib.getWallX()) { // eslint-disable-line no-undef
        p3.f[0] = -WallLib.getWallX(); // eslint-disable-line no-undef
      }
      if (p3.f[2] > WallLib.getWallZ()) {  // eslint-disable-line no-undef
        p3.f[2] = WallLib.getWallZ(); // eslint-disable-line no-undef
      }
      if (p3.f[2] < -2 * WallLib.getWallZ()) { // eslint-disable-line no-undef
        p3.f[2] = -2 * WallLib.getWallZ(); // eslint-disable-line no-undef
      }
      if (p3.f[1] < WallLib.getFloorHeight()) { // eslint-disable-line no-undef
        p3.f[1] = WallLib.getFloorHeight(); // eslint-disable-line no-undef
      }
      if (p3.f[1] > -WallLib.getFloorHeight()) { // eslint-disable-line no-undef
        p3.f[1] = -WallLib.getFloorHeight(); // eslint-disable-line no-undef
      }
      cont.selectedparticle.sleep = false;
      controller.selecteddice.setTouchPoint(p3, controller.selectedparticle, controller.index);
      */
    }

    function vrUp(controller) {
      const cont = controller;
      PlotterLib.setEndPosition();
      /*
      if (controller.selectedparticle !== null) {
        cont.selectedparticle = null;
        controller.selecteddice.setTouchPoint(null, controller.selectedparticle, controller.index);
      }
      */
    }


    VrLib.initVR = function initVR(canvas, runner, drawVRScene, gl, makeCamera, makeVRAdjustments) {
      const can = canvas;
      VrLib.drawVRScene = drawVRScene;
      if (navigator.getVRDisplays && navigator.getGamepads) { // eslint-disable-line no-undef
        console.log('WebVR 1.1 supported'); // eslint-disable-line no-console
      // Then get the displays attached to the computer
        navigator.getVRDisplays().then((displays) => { // eslint-disable-line no-undef
        // If a display is available, use it to present the scene
          if (displays.length > 0) {
            vrDisplay = displays[0];

            console.log('Display found'); // eslint-disable-line no-console
          // Starting the presentation when the button is clicked:
          // It can only be called in response to a user gesture
            btn.addEventListener('click', () => {
              if (btn.textContent === 'Start VR display') {
                vrDisplay.requestPresent([{ source: canvas }]).then(() => {
                  console.log('Presenting to WebVR display'); // eslint-disable-line no-console
                // Set the canvas size to the size of the vrDisplay viewport
                  const leftEye = vrDisplay.getEyeParameters('left');
                  const rightEye = vrDisplay.getEyeParameters('right');
                  can.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
                  can.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
                // stop the normal presentation, and start the vr presentation
                  window.cancelAnimationFrame(VrLib.normalSceneFrame);
                  //vrDisplay.depthFar = -100000.0;
                  makeVRAdjustments();
                  drawVRScene();
                  btn.textContent = 'Exit VR display';
                });
              } else {
                vrDisplay.exitPresent();
                console.log('Stopped presenting to WebVR display'); // eslint-disable-line no-console
                btn.textContent = 'Start VR display';
              // Stop the VR presentation, and start the normal presentation
                vrDisplay.cancelAnimationFrame(vrSceneFrame);
                can.width = window.innerWidth;
                can.height = window.innerHeight;
                // aspectRatio = canvas.width / canvas.height;
                gl.viewport(0, 0, canvas.width, canvas.height);
                makeCamera();

                runner();
              }
            });
          }
        });
      } else {
        console.log('WebVR API not supported by this browser.'); // eslint-disable-line no-console
      }
    };
/*
    function reportDisplays() {
      navigator.getVRDisplays().then(function(displays) {
        console.log(displays.length + ' displays');

        function reportGamepads() {
          var gamepads = navigator.getGamepads();
          console.log(gamepads.length + ' controllers');
          for(var i = 0; i < gamepads.length; ++i) {
            var gp = gamepads[i];
          }
          initialRun = false;
        }

        setTimeout(reportGamepads, 1000);
        // For VR, controllers will only be active after their corresponding headset is active
      });
    }
    */

    VrLib.drawScene = function drawScene() {
      // WebVR: Request the next frame of the animation
      vrSceneFrame = vrDisplay.requestAnimationFrame(VrLib.drawVRScene);
      // Populate frameData with the data of the next frame to display
      // if (VrLib.frameData) {

      vrDisplay.getFrameData(VrLib.frameData);
      // You can get the position, orientation, etc. of the display from the current frame's pose
      const gamepads = navigator.getGamepads(); // eslint-disable-line no-undef
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        /*
        if(gp && (textnotset || gp.buttons[0].pressed || gp.buttons[1].pressed)){
          const p = document.getElementById('fillertext');
          if(gp.buttons[0].pressed) b0 = true;
          if(gp.buttons[1].pressed) b1 = true;

          p.innerHTML = "Found gamepad axes "+gp.axes.length+" buttons "+gp.buttons.length+
          ((gp.pose)?"has pose":"no pose")+((gp.pose && gp.pose.orientation)?("has orientation "+gp.pose.orientation):" no orientation")+
          " buttons pressed b0 "+b0+" b1 "+b1;
          textnotset =false;
        }
        */
        if(gp && gp.pose && gp.pose.orientation && !gp.pose.position){
          vrcontrollers[gp.index].position =(gp.pose.position)?
            [gp.pose.position[0], gp.pose.position[1], gp.pose.position[2]]
            :[0,0,0];
          vrcontrollers[gp.index].orientation = gp.pose.orientation;
          if (vrcontrollers[gp.index].pressed === false && gp.buttons[1].pressed) {
            vrDown(vrcontrollers[gp.index]);
          } else if (vrcontrollers[gp.index].pressed === true && gp.buttons[1].pressed) {
            vrMove(vrcontrollers[gp.index]);
          } else if (vrcontrollers[gp.index].pressed === true && !gp.buttons[1].pressed) {
            vrUp(vrcontrollers[gp.index]);
          }
          vrcontrollers[gp.index].pressed = gp.buttons[1].pressed;
        }


        if (gp && gp.pose && gp.pose.position) {
          vrcontrollers[gp.index].position =
            [gp.pose.position[0], gp.pose.position[1], gp.pose.position[2]];
          vrcontrollers[gp.index].orientation = gp.pose.orientation;
          if (gp.buttons[1].pressed) {
            vrcontrollers[gp.index].color = [1.0, 0.0, 0.0];
          } else if (gp.buttons[3].touched) {
            vrcontrollers[gp.index].color = [0.0, 1.0, 0.0];
          } else {
            vrcontrollers[gp.index].color = [1.0, 1.0, 1.0];
          }
          if (vrcontrollers[gp.index].pressed === false && gp.buttons[1].pressed) {
            vrDown(vrcontrollers[gp.index]);
          } else if (vrcontrollers[gp.index].pressed === true && gp.buttons[1].pressed) {
            vrMove(vrcontrollers[gp.index]);
          } else if (vrcontrollers[gp.index].pressed === true && !gp.buttons[1].pressed) {
            vrUp(vrcontrollers[gp.index]);
          }
          vrcontrollers[gp.index].pressed = gp.buttons[1].pressed;
        }

        if(gp && gp.axes &&gp.axes[0]){
          const a = gp.axes[0];
          PlotterLib.scale(a);
        }
/*
          if (gp.buttons[2].pressed) {
            DiceLib.reroll(); // eslint-disable-line no-undef
          }

          if (gp.buttons[3].pressed && vrcontrollers[gp.index].dicebutton === false) {
            DiceLib.addDice(); // eslint-disable-line no-undef
          }
          vrcontrollers[gp.index].dicebutton = gp.buttons[3].pressed;

          if (gp.buttons[0].pressed) {
            DiceLib.clear(); // eslint-disable-line no-undef
          }

          if (gp.buttons[4].pressed && vrcontrollers[gp.index].dice2button === false) {
            DiceLib.createRandomColorDice(); // eslint-disable-line no-undef
          }
          */
          //vrcontrollers[gp.index].dice2button = gp.buttons[4].pressed;
        //}
      }
      // }
     // return frameData;
    };

    VrLib.submitFrame = function submitFrame() {
      vrDisplay.submitFrame();
    };

    return VrLib;
  }
  if (typeof (VrLib) === 'undefined') window.VrLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
