/* jshint esversion: 6 */

(function capsule(window) {
  function defineLibrary() {
    const PlotterLib = {};
    // const constraintsIterations = 10;
    // const frametime = 1000 / MSLib.framerate; // eslint-disable-line no-undef
    const floorheight = -1.7;
    let wallx = 0.5;
    let wallz = 1.0;
    const fov = 45;

    let gravity = null;
    let garray;
    const garraycount = 100;

    let cf = 0;
    let fi = 0;
    // let numberx = null;
    WallLib.setWalls(wallx, wallz, floorheight); // eslint-disable-line no-undef

    let gl; // A global variable for the WebGL context
    let programsphere;
    let program;
    let camerarotation = false;
    let cameraPos;
    let modelPos;

    let cameraNormal;
    let cameraUp;
    let canvas;
    let perspectiveMatrix;
    let cameraMatrix;
    let model;
    let view;
    let normalMat;

    let running = true;
    let sphereRenderer;
    let pointcount = 0;
    const pointcount2 = {};

    let dataType = 0;

    let hprogram;
    let h2program;
    let hsbuffer;
    let hcbuffer;
    let hpbuffer;
    let hibuffer;
    let hnbuffer;

    let stripes = 0;
    let stripePoints = 0;

    const hsbuffer2 = {};
    const hcbuffer2 = {};
    const hpbuffer2 = {};
    const hibuffer2 = {};
    const hnbuffer2 = {};

    const stripes2 = {};
    const stripePoints2 = {};

    let histogramvisible = false;
    let tresholdvalue = 0.5;
    let takeshotwhenready = false;

    let wallsOn = false;
    let flatShadingOn = false;
    let pointsOn = false;
    let meshOn = true;
    let clearColor = [0, 0, 0, 1];

    let legend;
    let legendtex;
    let legendprogram;
    let legendvertexbuffer;
    let legendtexcoordsbuffer;

    const frequencyArray = [];

    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef

    const SphereRenderer = SphereLib.SphereRenderer; // eslint-disable-line no-undef

    const InteractionState = {
      Normal: 0,
      Scale: 1,
      HorizontalRotate: 2,
      HorizontalTranslate: 3,
      VerticalTranslate: 4
    };
    const modelPosition = new Vec3(0, -1, -1);
    const modelTrans = new Matrix4();
    let modelRot = new Matrix4();
    const modelScale = new Matrix4();
    const modelPreRotTrans = new Matrix4();
    const modelPostRotTrans = new Matrix4();
    let mInteractionState = InteractionState.Normal;

    // const angle = 0.0;
    let modelTotal = new Matrix4();

    let mouseButtonPressed = false;
    let mouseButtonStartX = 0.0;
    let mouseButtonStartY = 0.0;
    const rotationStart = new Matrix4();
    let translateStartX = 0;
    let translateStartY = 0;
    let translateStartZ = 0;
    let scaleStartX = 1.0;
    let modelScaleFactor = 1.0;


    const mediaSource = new MediaSource();
    mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
    let mediaRecorder;
    let recordedBlobs;
    let sourceBuffer;
    let stream;
    let recordButton;
    let downloadButton;
    let playButton;


    function checkGlError() {
      if (gl.getError() !== gl.NO_ERROR) {
        console.log(`gl error ${gl.getError()}`);
      }
    }

    function storageAvailable(type) {
      try {
        const storage = window[type];
        const x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
      } catch (e) {
        return false;
      }
    }
    function componentToHex(c) {
      const hex = c.toString(16);
      return hex.length == 1 ? `0${hex}` : hex;
    }

    function rgbToHex(r, g, b) {
      return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
    }

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    function getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i += 1) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    function runPhysics() {
    }

    PlotterLib.toggleWalls = function toggleWalls() {
      wallsOn = !wallsOn;
    };

    PlotterLib.toggleFlatShading = function toggleFlatShading() {
      flatShadingOn = !flatShadingOn;
    };

    PlotterLib.togglePoints = function togglePoints() {
      pointsOn = !pointsOn;
    };

    PlotterLib.toggleMesh = function toggleMesh() {
      meshOn = !meshOn;
    };

    function drawGeometry(mod,vie,cam,pro) {
      gl.useProgram(program);
      gl.uniformMatrix4fv(program.uModel, false, new Float32Array(model.flatten()));
      gl.uniformMatrix4fv(program.uNormalMat, false, new Float32Array(normalMat.flatten()));

      gl.uniform4fv(program.uColor, [0.13, 0.13, 0.13, 1.0]); // table color
      gl.uniform4fv(program.uColor2, [0.0, 0.0, 0.0, 1.0]);
      gl.uniform4fv(program.uColor3, [0.1, 0.1, 0.1, 1.0]);
      gl.uniform1f(program.uDice, 0.0);
      gl.uniform1f(program.uTextureOffset, 0.0);

      const rm = new Matrix4();
      rm.rotateMatrix(Math.PI / 7, (new Vec3(-1, 0, 1)).normalized());
      const ligth = rm.multipleV((gravity.negative()).multiple(1 / 10));
      gl.uniform3fv(program.uLightPos, ligth.f);

      if (wallsOn) WallLib.drawWalls(gl, program); // eslint-disable-line no-undef
      gl.lineWidth(1.0);
      gl.useProgram(program);
      // for (let i = 0; i < gdices.length; i++) gdices[i].draw(program);

      if (histogramvisible === true) {
        gl.useProgram(hprogram);
        gl.uniform1f(hprogram.uTreshold, 0.0001 * tresholdvalue);
        if (dataType === 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
          gl.enableVertexAttribArray(hprogram.size);
          gl.vertexAttribPointer(hprogram.size, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
          gl.enableVertexAttribArray(hprogram.pos);
          gl.vertexAttribPointer(hprogram.pos, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
          gl.enableVertexAttribArray(hprogram.color);
          gl.vertexAttribPointer(hprogram.color, 3, gl.FLOAT, false, 0, 0);
          if (pointsOn)gl.drawArrays(gl.POINTS, 0, pointcount);

        // console.log(`buffer length ${pointcount}`);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
          if (!flatShadingOn) {
            gl.useProgram(h2program);
            gl.uniform1f(h2program.uTreshold, 0.0001 * tresholdvalue);

            gl.uniform3fv(h2program.uCameraPos, cameraPos.f);
            gl.uniform3fv(h2program.uLightPos, [0.2, 10.0, 20.0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
            gl.enableVertexAttribArray(h2program.size);
            gl.vertexAttribPointer(h2program.size, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
            gl.enableVertexAttribArray(h2program.pos);
            gl.vertexAttribPointer(h2program.pos, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
            gl.enableVertexAttribArray(h2program.color);
            gl.vertexAttribPointer(h2program.color, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hnbuffer);
            gl.enableVertexAttribArray(h2program.normal);
            gl.vertexAttribPointer(h2program.normal, 3, gl.FLOAT, false, 0, 0);
          // gl.drawArrays(gl.POINTS, 0, pointcount);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer);
          }
        // console.log(`stripePoints ${stripePoints}`);
        // console.log(`Stripes ${stripes}`);
          if (meshOn) {
            for (let i = 0; i < stripes; i++) {
          // console.log(`Drawing element ${i}`);
              gl.drawElements(gl.TRIANGLE_STRIP, stripePoints, gl.UNSIGNED_SHORT, stripePoints * i * 2);
            }
          }
        } else if (dataType === 1 && cf !== 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer2[cf]);
          gl.enableVertexAttribArray(hprogram.size);
          gl.vertexAttribPointer(hprogram.size, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer2[cf]);
          gl.enableVertexAttribArray(hprogram.pos);
          gl.vertexAttribPointer(hprogram.pos, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer2[cf]);
          gl.enableVertexAttribArray(hprogram.color);
          gl.vertexAttribPointer(hprogram.color, 3, gl.FLOAT, false, 0, 0);
          if (pointsOn)gl.drawArrays(gl.POINTS, 0, pointcount2[cf]);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer2[cf]);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
          if (!flatShadingOn) {
            gl.useProgram(h2program);
            gl.uniform1f(h2program.uTreshold, 0.0001 * tresholdvalue);

            gl.uniform3fv(h2program.uCameraPos, cameraPos.f);
            gl.uniform3fv(h2program.uLightPos, [0.2, 10.0, 20.0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer2[cf]);
            gl.enableVertexAttribArray(h2program.size);
            gl.vertexAttribPointer(h2program.size, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer2[cf]);
            gl.enableVertexAttribArray(h2program.pos);
            gl.vertexAttribPointer(h2program.pos, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer2[cf]);
            gl.enableVertexAttribArray(h2program.color);
            gl.vertexAttribPointer(h2program.color, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, hnbuffer2[cf]);
            gl.enableVertexAttribArray(h2program.normal);
            gl.vertexAttribPointer(h2program.normal, 3, gl.FLOAT, false, 0, 0);
          // gl.drawArrays(gl.POINTS, 0, pointcount);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer2[cf]);
          }
          // console.log(`stripePoints ${stripePoints2[cf]}`);
          // console.log(`Stripes ${stripes2[cf]}`);
          if (meshOn) {
            for (let i = 0; i < stripes2[cf]; i++) {
          // console.log(`Drawing element ${i}`);
              gl.drawElements(gl.TRIANGLE_STRIP, stripePoints2[cf], gl.UNSIGNED_SHORT, stripePoints2[cf] * i * 2);
            }
          }
        }
      }
      axis.draw(gl, mod,vie,cam,pro);
      if(legendtex !== undefined) drawLegend(gl);
      checkGlError();
    }

    function refresh() {
      runPhysics();
      gl.useProgram(program);
      // Set clear color to black, fully opaque
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      // Enable depth testing
      gl.enable(gl.DEPTH_TEST);
      // Near things obscure far things
      gl.depthFunc(gl.LEQUAL);
      // Clear the color as well as the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // eslint-disable-line no-bitwise

      gl.useProgram(program);
      gl.uniformMatrix4fv(program.uPerspectiveMatrix, false,
        new Float32Array(perspectiveMatrix.flatten()));
      gl.uniformMatrix4fv(program.uCamera, false, new Float32Array(cameraMatrix.flatten()));
      gl.uniformMatrix4fv(program.uModel, false, new Float32Array(model.flatten()));
      gl.uniformMatrix4fv(program.uView, false, new Float32Array(view.flatten()));
      gl.uniformMatrix4fv(program.uNormalMat, false, new Float32Array(normalMat.flatten()));

      gl.uniform4fv(program.uColor, [0.13, 0.13, 0.13, 1.0]); // table color
      gl.uniform4fv(program.uColor2, [0.0, 0.0, 0.0, 1.0]);
      gl.uniform4fv(program.uColor3, [0.1, 0.1, 0.1, 1.0]);
      gl.uniform1f(program.uDice, 0.0);
      gl.uniform1f(program.uTextureOffset, 0.0);

      const rm = new Matrix4();
      rm.rotateMatrix(Math.PI / 7, (new Vec3(-1, 0, 1)).normalized());
      const ligth = rm.multipleV((gravity.negative()).multiple(1 / 10));
      gl.uniform3fv(program.uLightPos, ligth.f);

      gl.useProgram(hprogram);
      gl.uniformMatrix4fv(hprogram.uPMatrix, false,
        new Float32Array(perspectiveMatrix.flatten())); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(hprogram.uVMatrix, false,
        new Float32Array(cameraMatrix.flatten()));  // eslint-disable-line no-undef
      // modelRot.rotationYMatrix(angle);
      modelTrans.translate(modelPosition.f[0], modelPosition.f[1], modelPosition.f[2]);
      modelScale.scale(modelScaleFactor, modelScaleFactor, modelScaleFactor);
      modelTotal = modelScale.multiple(modelRot.multiple(modelTrans));
      gl.uniformMatrix4fv(hprogram.uMMatrix, false, new Float32Array(modelTotal.flatten()));

      gl.useProgram(h2program);
      gl.uniformMatrix4fv(h2program.uPMatrix, false,
        new Float32Array(perspectiveMatrix.flatten())); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(h2program.uVMatrix, false,
        new Float32Array(cameraMatrix.flatten()));  // eslint-disable-line no-undef

      // modelRot.rotationYMatrix(angle);
      modelTrans.translate(modelPosition.f[0], modelPosition.f[1], modelPosition.f[2]);
      modelScale.scale(modelScaleFactor, modelScaleFactor, modelScaleFactor);
      modelTotal = modelScale.multiple(modelRot.multiple(modelTrans));
      gl.uniformMatrix4fv(h2program.uMMatrix, false, new Float32Array(modelTotal.flatten()));

      const n0Matrix = cameraMatrix.multiple(modelTotal);
      // console.log(n0Matrix);
      const n1Matrix = n0Matrix.invert();
      // console.log(n1Matrix);
      const nMatrix = n1Matrix.transpose();
      gl.uniformMatrix4fv(h2program.uNMatrix, false, new Float32Array(nMatrix.flatten()));


      gl.useProgram(program);
      drawGeometry(new Float32Array(modelTotal.flatten()),
        new Float32Array(view.flatten()),
        new Float32Array(cameraMatrix.flatten()),
        new Float32Array(perspectiveMatrix.flatten())
      	);
      if (takeshotwhenready) {
        PlotterLib.takeScreenshot();
        takeshotwhenready = false;
      }
    }

    function runner() {
      refresh();
      if (running) {
        VrLib.normalSceneFrame = window // eslint-disable-line no-undef
        .requestAnimationFrame(runner);
      }
    }

    function drawVRScene() {
      VrLib.drawScene(drawVRScene); // eslint-disable-line no-undef
      runPhysics();
      // if (VrLib.frameData) {
      // Clear the canvas before we start drawing on it.
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      // Enable depth testing
      gl.enable(gl.DEPTH_TEST);
      // Near things obscure far things
      gl.depthFunc(gl.LEQUAL);
      // Clear the color as well as the depth buffer.
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // eslint-disable-line no-bitwise
      const identity = new Matrix4();
      // WebVR: Create the required projection and view matrix locations needed
      // for passing into the uniformMatrix4fv methods below
      const projectionMatrixLocation = program.uPerspectiveMatrix;
      const viewMatrixLocation = program.uView;
      const projectionMatrixLocationSphere = programsphere.uPMatrix;
      const viewMatrixLocationSphere = programsphere.uVMatrix;
      const modelMatrixLocationSphere = programsphere.uMMatrix;

      // WebVR: Render the left eye’s view to the left half of the canvas
      gl.viewport(0, 0, canvas.width * 0.5, canvas.height);
      perspectiveMatrix.makePerspective(90, 16.0 / 9.0, 0.001, -10000.0);
      gl.useProgram(program);

      gl.uniformMatrix4fv(projectionMatrixLocation, false,
        VrLib.frameData.leftProjectionMatrix);// eslint-disable-line no-undef
      gl.uniformMatrix4fv(viewMatrixLocation, false,
        VrLib.frameData.leftViewMatrix); // eslint-disable-line no-undef
      const im = new Matrix4();
      gl.uniformMatrix4fv(program.uCamera, false, new Float32Array(im.flatten()));

      gl.useProgram(programsphere);
      gl.uniformMatrix4fv(projectionMatrixLocationSphere, false,
        VrLib.frameData.leftProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(viewMatrixLocationSphere, false,
        VrLib.frameData.leftViewMatrix);  // eslint-disable-line no-undef
      gl.uniformMatrix4fv(modelMatrixLocationSphere, false, identity.flatten());
      sphereRenderer.draw(programsphere,
        VrLib.getControllers(), // eslint-disable-line no-undef
        VrLib.getControllerIds());// eslint-disable-line no-undef
      gl.useProgram(hprogram);
      gl.uniformMatrix4fv(hprogram.uPMatrix, false,
          VrLib.frameData.leftProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(hprogram.uVMatrix, false,
          VrLib.frameData.leftViewMatrix);  // eslint-disable-line no-undef
      // modelRot.rotationYMatrix(angle);
      modelTotal = modelScale.multiple(modelRot.multiple(modelTrans));
      gl.uniformMatrix4fv(hprogram.uMMatrix, false, new Float32Array(modelTotal.flatten()));

      gl.useProgram(h2program);
      gl.uniformMatrix4fv(h2program.uPMatrix, false,
          VrLib.frameData.leftProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(h2program.uVMatrix, false,
          VrLib.frameData.leftViewMatrix);  // eslint-disable-line no-undef
      // modelRot.rotationYMatrix(angle);
      modelTotal = modelScale.multiple(modelRot.multiple(modelTrans));
      gl.uniformMatrix4fv(h2program.uMMatrix, false, new Float32Array(modelTotal.flatten()));
      drawGeometry();
      // WebVR: Render the right eye’s view to the right half of the canvas
      gl.viewport(canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height);
      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionMatrixLocation, false,
        VrLib.frameData.rightProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(viewMatrixLocation, false,
        VrLib.frameData.rightViewMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(program.uCamera, false, new Float32Array(im.flatten()));
      /* ///
      gl.useProgram(program2);
      gl.uniformMatrix4fv(projectionMatrixLocation2, false, frameData.rightProjectionMatrix);
      gl.uniformMatrix4fv(viewMatrixLocation2, false, frameData.rightViewMatrix);
      gl.uniformMatrix4fv(program2.uCamera, false, new Float32Array(im.flatten()));
      *///
      gl.useProgram(programsphere);
      gl.uniformMatrix4fv(projectionMatrixLocationSphere, false,
        VrLib.frameData.rightProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(viewMatrixLocationSphere, false,
        VrLib.frameData.rightViewMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(modelMatrixLocationSphere, false, identity.flatten());
      sphereRenderer.draw(programsphere,
        VrLib.getControllers(), // eslint-disable-line no-undef
        VrLib.getControllerIds()); // eslint-disable-line no-undef

      gl.useProgram(hprogram);
      gl.uniformMatrix4fv(hprogram.uPMatrix, false,
          VrLib.frameData.rightProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(hprogram.uVMatrix, false,
          VrLib.frameData.rightViewMatrix);  // eslint-disable-line no-undef

      gl.useProgram(h2program);
      gl.uniformMatrix4fv(h2program.uPMatrix, false,
              VrLib.frameData.rightProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(h2program.uVMatrix, false,
              VrLib.frameData.rightViewMatrix);  // eslint-disable-line no-undef
      // gl.uniformMatrix4fv(hprogram.uMMatrix, false, new Float32Array(model.flatten()));
      // }
      drawGeometry();
      VrLib.submitFrame(); // eslint-disable-line no-undef
    }

    PlotterLib.getRotateCamera = function getRotateCamera() {
      return camerarotation;
    };

    PlotterLib.setRotateCamera = function setRotateCamera(rotation) {
      const oldvalue = camerarotation;
      camerarotation = rotation;
      if (!oldvalue) {
        setTimeout(refresh, frametime);
      }
    };

    PlotterLib.step = function step() {
      refresh();
    };

    PlotterLib.play = function play() {
      if (running) {
        running = false;
      } else {
        running = true;
        runner();
      }
    };

    PlotterLib.clear = function clear() {
      VrLib.setDices(dices); // eslint-disable-line no-undef
      // MSLib.setDices(dices); // eslint-disable-line no-undef
      // gdices = [];
      // DicesLib.ballConstraints = []; // eslint-disable-line no-undef
    };

    function makeCamera() {
      perspectiveMatrix = new Matrix4();
      cameraMatrix = new Matrix4();
      model = new Matrix4();
      view = new Matrix4();
      normalMat = new Matrix4();
      const viewangle = (35 * Math.PI) / 180;
      const viewdistance = wallz / Math.tan(((fov / 2) * Math.PI) / 180);
      cameraPos = new Vec3(0.0, Math.sin(viewangle) * viewdistance,
        Math.cos(viewangle) * (viewdistance));
      modelPos = new Vec3(0.0, Math.sin(viewangle) * floorheight,
        Math.cos(viewangle) * floorheight);
      cameraNormal = new Vec3(0, 0, 1);
      cameraUp = new Vec3(0, 1, 0);
      const rot = new Matrix4();
      // rot.rotationYMatrix(coffset);
      rot.rotateMatrix(viewangle, new Vec3(-1, 0, 0));
      const rot2 = new Matrix4();
      // rot2.rotationYMatrix(coffset);
      rot2.rotateMatrix(-viewangle, new Vec3(-1, 0, 0));
      cameraNormal = rot2.multipleV(cameraNormal);
      cameraUp = rot2.multipleV(cameraUp);
      // cameraRotation = rot2;
      const trans = new Matrix4();
      trans.translate(-cameraPos.f[0], -cameraPos.f[1], -cameraPos.f[2]);
      const trans2 = new Matrix4();
      // trans2.translate(0.0, -2*floorheight, 0);
      trans2.translate(modelPos.f[0], modelPos.f[1], modelPos.f[2]);
      cameraMatrix = trans2.multiple(trans.multiple(rot));
      normalMat = trans2.multiple(trans.multiple(rot));
      perspectiveMatrix.makePerspective(fov, canvas.width / canvas.height, viewdistance, 100.0);
      /* MouseLib.setCamera(cameraNormal, // eslint-disable-line no-undef
        cameraUp, cameraPos, modelPos);*/
    }

    PlotterLib.resize = function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      aspectRatio = canvas.width / canvas.height;
      wallx = (0.5 / canvas.height) * canvas.width * 2.0;
      wallz = 1.0;
      gl.viewport(0, 0, canvas.width, canvas.height);
      WallLib.setWalls(wallx, wallz, floorheight); // eslint-disable-line no-undef
      // WallLib.makeWalls(); // eslint-disable-line no-undef
      WallLib.makeWallBuffers(gl); // eslint-disable-line no-undef
      makeCamera();
      // PlotterLib.reroll();
    };

    PlotterLib.fullScreen = function fullScreen() {
      const bodyE = document.getElementById('bod'); // eslint-disable-line no-undef
      if (document.webkitIsFullScreen) { // eslint-disable-line no-undef
        document.webkitCancelFullScreen(); // eslint-disable-line no-undef
      } else if (bodyE.webkitRequestFullScreen) {
        bodyE.webkitRequestFullScreen();
        const lockFunction = window.screen.orientation.lock; // eslint-disable-line no-undef
        if (lockFunction.call(window.screen.orientation, 'landscape')) { // eslint-disable-line no-undef
          // console.log('Orientation locked');
        } else {
          //  console.error('There was a problem in locking the orientation');
        }
      }
    };

    function initWebGL(canvas) {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      WallLib.initTextures(gl); // eslint-disable-line no-undef
      gl.viewport(0, 0, canvas.width, canvas.height);
      return gl;
    }

    PlotterLib.addHistogramSet = function addHistogramSet(file) {
      const histogram = null;// new Uint32Array(256 * 256 * 256);

      const reader = new FileReader();
      reader.onload = function () {
        const arrayBuffer = reader.result;

        // const stream = new DataStream(arrayBuffer, 0,
        //  DataStream.LITTLE_ENDIAN);
        console.log(`arraybuffer ${arrayBuffer}`);
        const histogram = new Uint32Array(arrayBuffer);
        // histogram = Uint32Array.from(file);
        console.log('reading done');
        let maximum = 0;
        let mr = 1;
        let mg = 2;
        let mb = 3;
        for (let r = 0; r < 256; r++) {
          for (let g = 0; g < 256; g++) {
            for (let b = 0; b < 256; b++) {
              const value = histogram[r + 256 * g + 256 * 256 * b];
              if (value > maximum) {
                maximum = value;
                mr = r;
                mg = g;
                mb = b;
              }
            }
          }
        }
        console.log(`largest value is ${maximum} r ${mr} g ${mg} b ${mb}`);
        const histogrambuffer = new Float32Array(256 * 256 * 256);
        const histogramcolorbuffer = new Float32Array(256 * 256 * 256 * 3);
        const histogrampositionbuffer = new Float32Array(256 * 256 * 256 * 3);
        const space = 0.005;
        for (let r = 0; r < 256; r++) {
          for (let g = 0; g < 256; g++) {
            for (let b = 0; b < 256; b++) {
              const offset = r + 256 * g + 256 * 256 * b;
              const value = histogram[offset];
              histogrambuffer[offset] = value / (maximum * 1.00);
              histogramcolorbuffer[offset * 3] = r / 256;
              histogramcolorbuffer[(offset * 3) + 1] = g / 256;
              histogramcolorbuffer[(offset * 3) + 2] = b / 256;

              histogrampositionbuffer[offset * 3] = r * space - 128 * space;
              histogrampositionbuffer[(offset * 3) + 1] = g * space - 128 * space;
              histogrampositionbuffer[(offset * 3) + 2] = b * space - 128 * space;
            }
          }
        }
/*
        let maximumf = 0;
        let mrf = 1;
        let mgf = 2;
        let mbf = 3;
        for (let r = 0; r < 256; r++) {
          for (let g = 0; g < 256; g++) {
            for (let b = 0; b < 256; b++) {
              const value = histogrambuffer[r + 256 * g + 256 * 256 * b];
              if (value > maximumf) {
                maximumf = value;
                mrf = r;
                mgf = g;
                mbf = b;
              }
            }
          }
        }*/
        console.log('paskottu '); // ${maximumf} ${mrf} ${mgf} ${mbf}
        // gl.useProgram(hprogram);
        hsbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogrambuffer, gl.STATIC_DRAW);

        hcbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogramcolorbuffer, gl.STATIC_DRAW);

        hpbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogrampositionbuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        pointcount = 256 * 256 * 256;
        histogramvisible = true;
        console.log('READY OR NOT');
      };
      reader.onerror = function () {
        console.log('Danger will robinson');
      };
      reader.readAsArrayBuffer(file);
    };

    function calculateNormal(dataposbuffer, maxpoints, stripes, i) {
      const o1 = i * 3;
      const o2 = (i + 1) * 3;
      const totalpoints = dataposbuffer.length / 3;

      const o3 = ((i + maxpoints < totalpoints) ? (i + maxpoints) : (i - maxpoints)) * 3;
      const point = new Vec3(dataposbuffer[o1], dataposbuffer[o1 + 1], dataposbuffer[o1 + 2]);
      // const np = point.normalized();
      const a = new Vec3(dataposbuffer[o2], dataposbuffer[o2 + 1], dataposbuffer[o2 + 2]);
      const b = new Vec3(dataposbuffer[o3], dataposbuffer[o3 + 1], dataposbuffer[o3 + 2]);
      // console.log(`a ${a.f}`);
      const v1 = a.subtract(point);
      const v2 = b.subtract(point);
      const n = v1.cross(v2);

      if (i % maxpoints >= maxpoints / 2) {
        const np = n.normalized();
        return np.negative();
        // return new Vec3(0, 0, 0);
      }
      const np = n.normalized();
      return np;// .negative();
    }

    function calculateNormal2(dataposbuffer, indexbuffer, maxpoints, stripes, i) {
      const o1 = indexbuffer[i * 2] * 3;
      const o2 = indexbuffer[i * 2 + 1] * 3;

      const o3 = indexbuffer[i * 2 + 2] * 3;
      const point = new Vec3(dataposbuffer[o1], dataposbuffer[o1 + 1], dataposbuffer[o1 + 2]);
      // const np = point.normalized();
      const a = new Vec3(dataposbuffer[o2], dataposbuffer[o2 + 1], dataposbuffer[o2 + 2]);
      const b = new Vec3(dataposbuffer[o3], dataposbuffer[o3 + 1], dataposbuffer[o3 + 2]);
      // console.log(`a ${a.f}`);

      const v1 = a.subtract(point);
      const v2 = b.subtract(point);


      const n = v1.cross(v2);
      const np = n.normalized();
      if (i % maxpoints >= maxpoints / 2) {
        return np.negative();
      }

      return np;
    }

    function calculateNormal4(dataposbuffer, indexbuffer, maxpoints, stripes, i) {
      const o1 = indexbuffer[i * 2] * 3;
      const o2 = indexbuffer[(i * 2) + 1] * 3;
      const o3 = indexbuffer[(i * 2) + 2] * 3;
      const o4 = indexbuffer[(i * 2) - 1] * 3;
      const o5 = indexbuffer[(i * 2) - 2] * 3;
      const point = new Vec3(dataposbuffer[o1], dataposbuffer[o1 + 1], dataposbuffer[o1 + 2]);
      // const np = point.normalized();
      const a = new Vec3(dataposbuffer[o2], dataposbuffer[o2 + 1], dataposbuffer[o2 + 2]);
      const b = new Vec3(dataposbuffer[o3], dataposbuffer[o3 + 1], dataposbuffer[o3 + 2]);
      // console.log(`a ${a.f}`);
      const c = new Vec3(dataposbuffer[o4], dataposbuffer[o4 + 1], dataposbuffer[o4 + 2]);
      const d = new Vec3(dataposbuffer[o5], dataposbuffer[o5 + 1], dataposbuffer[o5 + 2]);

      const v1 = a.subtract(point);
      const v2 = b.subtract(point);
      const n1 = v1.cross(v2);

      const v3 = d.subtract(point);
      const v4 = c.subtract(point);

      const n2 = v3.cross(v4);

      const n = (n1.add(n2)).divide(2);
      const np = n.normalized();
      if (i % maxpoints >= maxpoints / 2) {
        return np.negative();
      }

      return np;
    }


/*
    function swap(i, maxpoints) {
      if (i % maxpoints > maxpoints / 2) {
        return true;
      }
      return false;
    }

    function calculateNormal3(dataposbuffer, maxpoints, stripes, i) {
      const o1 = i * 3;
      let o2 = (i + 1) * 3;
      const o3 = (i + maxpoints) * 3;
      if (swap(i, maxpoints)) {
        o2 = (i - 1) * 3;
      }
      const point = new Vec3(dataposbuffer[o1], dataposbuffer[o1 + 1], dataposbuffer[o1 + 2]);
      // const np = point.normalized();
      const a = new Vec3(dataposbuffer[o2], dataposbuffer[o2 + 1], dataposbuffer[o2 + 2]);
      const b = new Vec3(dataposbuffer[o3], dataposbuffer[o3 + 1], dataposbuffer[o3 + 2]);
      // console.log(`a ${a.f}`);

      const v1 = a.subtract(point);
      const v2 = b.subtract(point);


      const n = v1.cross(v2);
      const np = n.normalized();


      return np;
    }
    */


    function getPseudoColor(value) {
      const colors = [0, 0, 0,
        0, 0, 1,
        0, 1, 1,
        0, 1, 0,
        1, 1, 0,
        1, 0, 0,
        0.5, 0, 0];
      let firstColor = 0;
      let secondColor = 0;
      let f = 0;
      if (value <= 0) {
        firstColor = 0;
        secondColor = 0;
      } else if (value >= 1.0) {
        firstColor = (colors.length / 3) - 2;
        secondColor = (colors.length / 3) - 1;
      } else {
        const v = (value * ((colors.length / 3) - 1));
        firstColor = Math.floor(v);
        secondColor = firstColor + 1;
        f = v - firstColor;
      }
      // console.log(`fc ${firstColor} sc ${secondColor}`);

      const r = (colors[firstColor * 3] * (1.0 - f)) + (colors[secondColor * 3] * (f));
      const g = (colors[(firstColor * 3) + 1] * (1.0 - f)) + (colors[(secondColor * 3) + 1] * (f));
      const b = (colors[(firstColor * 3) + 2] * (1.0 - f)) + (colors[(secondColor * 3) + 2] * (f));
      return { red: r, green: g, blue: b };
    }

    PlotterLib.addRadioDataSet = function addRadioDataSet(file) {
      const histogram = null;// new Uint32Array(256 * 256 * 256);

      const reader = new FileReader();
      reader.onload = function () {
        const stringBuffer = reader.result;
        const splitStringBuffer = stringBuffer.split('\n');

        dataType = 0;
        // const stream = new DataStream(arrayBuffer, 0,
        //  DataStream.LITTLE_ENDIAN);
        console.log(`Lines ${splitStringBuffer.length}`);
        let datastart = 0;
        for (let i = 0; i < splitStringBuffer.length; i++) {
          if (splitStringBuffer[i].startsWith('Azimuth')) {
            const splitline = splitStringBuffer[i].split('\t');
            if (splitline[1] === 'Frequency') {
              dataType = 1;
            }
            datastart = i + 1;
          }
        }

        if (dataType === 0) {
          console.log(`data start ${datastart} line before \n${splitStringBuffer[datastart - 1]}\nfirst line \n${splitStringBuffer[datastart]}`);
          const dataLength = splitStringBuffer.length - datastart;
        // const angleArray = new Float32Array(dataLength * 2);
        // const valueArray = new Float32Array(dataLength);

          const dataArray = [];

          let maxv = -1000;
          let minv = 1000;
          for (let i = 0; i < dataLength; i++) {
            const line = splitStringBuffer[i + datastart];
            const splitLine = line.split('\t');
            const azimuth = parseFloat(splitLine[0]);
          // angleArray[i * 2] = azimuth;
            const elevation = parseFloat(splitLine[1]);
          // angleArray[(i * 2) + 1] = elevation;
            const value = parseFloat(splitLine[2]);
          // valueArray[i] = value;
            dataArray.push({ azimuth, elevation, value });
            if (maxv < value) {
              maxv = value;
            }
            if (minv > value) {
              minv = value;
            }
          }

          let counter = 0;
          let previousA = dataArray[0].azimuth;
          let maxpoints = 0;
          stripes = 0;
          const cArray = [];
          cArray.push(0);
          for (let i = 0; i < dataLength; i++) {
            const dp = dataArray[i];

            if (previousA !== dp.azimuth) {
              console.log(`points before change ${counter}`);
              if (maxpoints < counter) {
                maxpoints = counter;
              }

              stripes++;
              cArray.push(counter + cArray[cArray.length - 1]);
              counter = 0;
            }
            counter++;
            previousA = dp.azimuth;
          }
          cArray.push(counter + cArray[cArray.length - 1]);
          console.log(`carray ${cArray}`);
          console.log(`stripes ${stripes}`);
          stripePoints = 2 * maxpoints;

        // console.log(`largest value is ${maximum} r ${mr} g ${mg} b ${mb}`);
          let maxx = 0.0;
          let maxy = 0.0;
          let maxz = 0.0;
          const datavaluebuffer = new Float32Array(dataArray.length);
          const datacolorbuffer = new Float32Array(dataArray.length * 3);
          const datapositionbuffer = new Float32Array(dataArray.length * 3);
          const datanormalbuffer = new Float32Array(dataArray.length * 3);
          const indexBuffer = new Uint16Array(maxpoints * stripes * 2);
          const radius = 1.0;
        // const j = 0;
        // const pcounter = 0;
        // previousA = dataArray[0].azimuth;
          for (let i = 0; i < dataLength; i++) {
            const dp = dataArray[i];
            const value = dp.value;
            const azimuth = dp.azimuth;
            const angle = dp.elevation;
            //const fv = 1.0 - (Math.abs(value) / maxv);
            const fv = ((value-minv) / (maxv-minv));
            datavaluebuffer[i] = fv;

            const colorX = getPseudoColor(fv);
          // console.log(`colorx ${colorX.red}`);
            datacolorbuffer[i * 3] = colorX.red;
            datacolorbuffer[(i * 3) + 1] = colorX.green;
            datacolorbuffer[(i * 3) + 2] = colorX.blue;

            const v = new Vec3(0.0, 0.0, (fv) * radius);
            const rotY = new Matrix4();
            rotY.rotationYMatrix(angle);
            const rotX = new Matrix4();
            rotX.rotationZMatrix(azimuth);
            const rot = rotY.multiple(rotX);
            const result = rot.multipleV(v);


            if (result.f[0] > maxx) {
              maxx = result.f[0];
            }
            if (result.f[1] > maxy) {
              maxy = result.f[1];
            }
            if (result.f[2] > maxz) {
              maxz = result.f[2];
            }

            datapositionbuffer[i * 3] = result.f[0];
            datapositionbuffer[(i * 3) + 1] = result.f[1];
            datapositionbuffer[(i * 3) + 2] = result.f[2];
          }

          for (let i = 0; i < maxpoints; i++) {
            for (let j = 0; j < stripes; j++) {
              const index = cArray[j] + i;
              indexBuffer[(i + (j * maxpoints)) * 2] = index;
              if (j > 0) {
                indexBuffer[((i + (j * maxpoints)) * 2) + 1] = indexBuffer[(i + ((j - 1) * maxpoints)) * 2];
              }
            }
          }

          for (let i = 0; i < maxpoints; i++) {
            indexBuffer[((maxpoints - i - 1) * 2) + 1] = indexBuffer[(i + ((stripes - 1) * maxpoints)) * 2];
          // indexBuffer[(i * 2) + 1] = indexBuffer[((maxpoints * (stripes - 1)) + (maxpoints - i)) * 2];
          }


          for (let i = 0; i < dataLength; i++) {
            const normal = calculateNormal4(datapositionbuffer, indexBuffer, maxpoints, stripes, i);
          // const n = new Vec3(0.0, 0.0, 1.0);
          // const normal = rot.multipleV(n);
          // const normal = calculateNormal3(datapositionbuffer, maxpoints, stripes, i);
            datanormalbuffer[i * 3] = normal.f[0];
            datanormalbuffer[(i * 3) + 1] = normal.f[1];
            datanormalbuffer[(i * 3) + 2] = normal.f[2];
          }
          console.log(`points after cahnge ${counter}`);
          console.log(`max x ${maxx} y ${maxy} z ${maxz} v ${maxv}`);
          console.log(`indexBuffer ${indexBuffer}`);

          console.log('Calculated'); // ${maximumf} ${mrf} ${mgf} ${mbf}
        // gl.useProgram(hprogram);
          hsbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datavaluebuffer, gl.STATIC_DRAW);

          hcbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datacolorbuffer, gl.STATIC_DRAW);

          hpbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datapositionbuffer, gl.STATIC_DRAW);

          hnbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hnbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datanormalbuffer, gl.STATIC_DRAW);

          hibuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW);

          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          pointcount = dataLength;
          histogramvisible = true;
          console.log('READY OR NOT');
          updateLegend(maxv,minv);
        } else if (dataType === 1) {
          const testfreq = splitStringBuffer[datastart].split('\t')[1];
          let k = 0;
          while (testfreq === splitStringBuffer[datastart + k].split('\t')[1]) {
            k++;
          }
          console.log(`Datacount ${k}`);
          const dataPointCount = 63;

          console.log(`data start ${datastart} line before \n${splitStringBuffer[datastart - 1]}\nfirst line \n${splitStringBuffer[datastart]}`);
          const dataLength = splitStringBuffer.length - datastart;
        // const angleArray = new Float32Array(dataLength * 2);
        // const valueArray = new Float32Array(dataLength);

          const dataArray = {};

          const maxv2 = {};
          const minv2 = {};
          for (let i = 0; i < dataLength; i++) {
            const line = splitStringBuffer[i + datastart];
            const splitLine = line.split('\t');
            const azimuth = parseFloat(splitLine[0]);
          // angleArray[i * 2] = azimuth;
            const frequency = splitLine[1];
          // angleArray[(i * 2) + 1] = elevation;
            const sensor = parseFloat(splitLine[2]);

            const value = parseFloat(splitLine[3]);
          // valueArray[i] = value;
            if (dataArray[frequency] === undefined) {
              dataArray[frequency] = [];
              frequencyArray.push(frequency);
            }
            dataArray[frequency].push({ azimuth, elevation: (Math.PI * 2.0 * sensor / dataPointCount), value });
            if (maxv2[0] === undefined) {
              maxv2[0] = 0.0;
              minv2[0] = 1000000.0;
            }
            if (maxv2[0] < Math.abs(value)) {
              maxv2[0] = Math.abs(value);
            }
            if (minv2[0] > Math.abs(value)) {
              minv2[0] = Math.abs(value);
            }
          }


          for (let k = 0; k < frequencyArray.length; k++) {
            const f = frequencyArray[k];
            console.log(`max ${maxv2[0]} min ${minv2[0]}`);
            // console.log(`freq ${f}`);
            let counter = 0;
            let previousA = dataArray[f][0].azimuth;
            let maxpoints = 0;
            stripes2[f] = 0;
            const cArray = [];
            cArray.push(0);
            for (let i = 0; i < dataArray[f].length; i++) {
              const dp = dataArray[f][i];
              // console.log(`dp ${dp}`);

              if (previousA !== dp.azimuth) {
                // console.log(`points before change ${counter}`);
                if (maxpoints < counter) {
                  maxpoints = counter;
                }

                stripes2[f]++;
                cArray.push(counter + cArray[cArray.length - 1]);
                counter = 0;
              }
              counter++;
              previousA = dp.azimuth;
            }
            cArray.push(counter + cArray[cArray.length - 1]);
            // console.log(`carray ${cArray}`);
            // console.log(`stripes ${stripes}`);
            stripePoints2[f] = 2 * maxpoints;
            console.log(`mp${maxpoints} ${f}`);
        // console.log(`largest value is ${maximum} r ${mr} g ${mg} b ${mb}`);
            let maxx = 0.0;
            let maxy = 0.0;
            let maxz = 0.0;
            const datavaluebuffer = new Float32Array(dataArray[f].length);
            const datacolorbuffer = new Float32Array(dataArray[f].length * 3);
            const datapositionbuffer = new Float32Array(dataArray[f].length * 3);
            const datanormalbuffer = new Float32Array(dataArray[f].length * 3);
            const indexBuffer = new Uint16Array(maxpoints * stripes2[f] * 2);
            const radius = 1.0;
        // const j = 0;
        // const pcounter = 0;
        // previousA = dataArray[0].azimuth;
            for (let i = 0; i < dataArray[f].length; i++) {
              const dp = dataArray[f][i];
              const value = dp.value;
              const azimuth = dp.azimuth;
              const angle = dp.elevation;
              // const fv = value / maxv2[0];
              // const fv = -1 + (Math.abs(value) - Math.abs(minv2[0])) / (Math.abs(maxv2[0]) - Math.abs(minv2[0]));
              const fv = 1.0 * value / 20.0;
              const fvcolor = (Math.abs(value) / 20.0 - Math.abs(minv2[0]) / 20.0) / (Math.abs(maxv2[0]) / 20.0 - Math.abs(minv2[0]) / 20.0);
              // const fvcolor = 1 - (Math.abs(value) - Math.abs(minv2[0])) / (Math.abs(maxv2[0]) - Math.abs(minv2[0]));
              datavaluebuffer[i] = fv;

              const colorX = getPseudoColor(fvcolor);
          // console.log(`colorx ${colorX.red}`);
              datacolorbuffer[i * 3] = colorX.red;
              datacolorbuffer[(i * 3) + 1] = colorX.green;
              datacolorbuffer[(i * 3) + 2] = colorX.blue;

              const v = new Vec3(0.0, 0.0, (fv) * radius);
              const rotY = new Matrix4();
              rotY.rotationYMatrix(angle);
              const rotX = new Matrix4();
              rotX.rotationZMatrix(azimuth);
              const rot = rotY.multiple(rotX);
              const result = rot.multipleV(v);


              if (result.f[0] > maxx) {
                maxx = result.f[0];
              }
              if (result.f[1] > maxy) {
                maxy = result.f[1];
              }
              if (result.f[2] > maxz) {
                maxz = result.f[2];
              }

              datapositionbuffer[i * 3] = result.f[0];
              datapositionbuffer[(i * 3) + 1] = result.f[1];
              datapositionbuffer[(i * 3) + 2] = result.f[2];
            }

            for (let i = 0; i < maxpoints; i++) {
              for (let j = 0; j < stripes2[f]; j++) {
                const index = cArray[j] + i;
                indexBuffer[(i + (j * maxpoints)) * 2] = index;
                if (j > 0) {
                  indexBuffer[((i + (j * maxpoints)) * 2) + 1] = indexBuffer[(i + ((j - 1) * maxpoints)) * 2];
                }
              }
            }

            for (let i = 0; i < maxpoints; i++) {
              indexBuffer[((maxpoints - i - 1) * 2) + 1] = indexBuffer[(i + ((stripes2[f] - 1) * maxpoints)) * 2];
          // indexBuffer[(i * 2) + 1] = indexBuffer[((maxpoints * (stripes - 1)) + (maxpoints - i)) * 2];
            }


            for (let i = 0; i < dataArray[f].length; i++) {
              const normal = calculateNormal4(datapositionbuffer, indexBuffer, maxpoints, stripes2[f], i);
          // const n = new Vec3(0.0, 0.0, 1.0);
          // const normal = rot.multipleV(n);
          // const normal = calculateNormal3(datapositionbuffer, maxpoints, stripes, i);
              datanormalbuffer[i * 3] = normal.f[0];
              datanormalbuffer[(i * 3) + 1] = normal.f[1];
              datanormalbuffer[(i * 3) + 2] = normal.f[2];
            }
            // console.log(`points after cahnge ${counter}`);
            // console.log(`max x ${maxx} y ${maxy} z ${maxz} v ${maxv}`);
            // console.log(`indexBuffer ${indexBuffer}`);

            // console.log('Calculated'); // ${maximumf} ${mrf} ${mgf} ${mbf}
        // gl.useProgram(hprogram);
            hsbuffer2[f] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer2[f]);
            gl.bufferData(gl.ARRAY_BUFFER, datavaluebuffer, gl.STATIC_DRAW);

            hcbuffer2[f] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer2[f]);
            gl.bufferData(gl.ARRAY_BUFFER, datacolorbuffer, gl.STATIC_DRAW);

            hpbuffer2[f] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer2[f]);
            gl.bufferData(gl.ARRAY_BUFFER, datapositionbuffer, gl.STATIC_DRAW);

            hnbuffer2[f] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, hnbuffer2[f]);
            gl.bufferData(gl.ARRAY_BUFFER, datanormalbuffer, gl.STATIC_DRAW);

            hibuffer2[f] = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer2[f]);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            pointcount2[f] = dataLength;
          }
          histogramvisible = true;
          cf = frequencyArray[0];
          console.log('READY OR NOT2');
          updateLegend(maxv2[0],minv2[0]);
        }
      };
      reader.onerror = function () {
        console.log('Danger will robinson');
      };
      reader.readAsText(file);
    };

    PlotterLib.screenshot = function screenshot() {
      takeshotwhenready = true;
    };

    PlotterLib.takeScreenshot = function takeScreenshot() {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'screenshot.png';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    };

    function handleSourceOpen(event) {
      console.log('MediaSource opened');
      sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
      console.log('Source buffer: ', sourceBuffer);
    }

    function handleDataAvailable(event) {
      if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
      }
    }

    function handleStop(event) {
      console.log('Recorder stopped: ', event);
      recordedVideos.push(recordedBlobs);
      addVideoElement(recordedBlobs);
    }

    function toggleRecording() {
      if (recordButton.textContent === 'record') {
        startRecording();
      } else {
        stopRecording();
        recordButton.textContent = 'record';
        playButton.disabled = false;
        downloadButton.disabled = false;
      }
    }


    function startRecording() {
      stream = canvas.captureStream(); // frames per second
      let options = { mimeType: 'video/webm' };
      recordedBlobs = [];
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e0) {
        console.log('Unable to create MediaRecorder with options Object: ', e0);
        try {
          options = { mimeType: 'video/webm,codecs=vp9' };
          mediaRecorder = new MediaRecorder(stream, options);
        } catch (e1) {
          console.log('Unable to create MediaRecorder with options Object: ', e1);
          try {
            options = 'video/vp8'; // Chrome 47
            mediaRecorder = new MediaRecorder(stream, options);
          } catch (e2) {
            alert('MediaRecorder is not supported by this browser.\n\n' +
          'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
            console.error('Exception while creating MediaRecorder:', e2);
            return;
          }
        }
      }
      console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
      recordButton.textContent = 'Stop Recording';
      playButton.disabled = true;
      downloadButton.disabled = true;
      mediaRecorder.onstop = handleStop;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.start(100); // collect 100ms of data
      console.log('MediaRecorder started', mediaRecorder);
    }

    function stopRecording() {
      mediaRecorder.stop();
      console.log('Recorded Blobs: ', recordedBlobs);

    // video.controls = true;
    }

    function play() {
      const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
    // video.src = window.URL.createObjectURL(superBuffer);
    }

    function download() {
      const blob = new Blob(recordedBlobs, { type: 'video/webm' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const filename = document.getElementById('filename');
      a.download = filename.value;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }

    PlotterLib.mouseDown = function mouseDown(event) {
      // console.log('Mouse down');
      mouseButtonPressed = true;
      mouseButtonStartX = event.pageX;
      mouseButtonStartY = event.pageY;
      if (mInteractionState === InteractionState.Normal) {
        rotationStart.setMatrixData(modelRot.m); // ??
        translateStartX = modelPosition.f[0];
        translateStartY = modelPosition.f[1];
        translateStartZ = modelPosition.f[2];
      } else if (mInteractionState === InteractionState.HorizontalRotate) {
        rotationStart.setMatrixData(modelRot.m); // ??
      } else if (mInteractionState === InteractionState.HorizontalTranslate) {
        translateStartX = modelPosition.f[0];
        translateStartY = modelPosition.f[1];
        translateStartZ = modelPosition.f[2];
      } else if (mInteractionState === InteractionState.VerticalTranslate) {
        translateStartX = modelPosition.f[0];
        translateStartY = modelPosition.f[1];
        translateStartZ = modelPosition.f[2];
      } else if (mInteractionState === InteractionState.Scale) {
        scaleStartX = modelScaleFactor;
      }
      // event.preventDefault();
      // return true;
    };

    PlotterLib.mouseMove = function mouseMove(event) {
      // console.log('Mouse move');
      if (mouseButtonPressed) {
        if (mInteractionState === InteractionState.Normal) {
          if (event.buttons & 0x1) {
            const addRotX = new Matrix4();
            addRotX.rotationYMatrix(((mouseButtonStartX - event.pageX) * -0.005));
            const addRotY = new Matrix4();
            addRotY.rotationXMatrix(((mouseButtonStartY - event.pageY) * 0.005));
            modelRot = rotationStart.multiple(addRotX.multiple(addRotY));
          } else if (event.buttons & 0x2 || event.buttons & 0x4) {
            modelPosition.f[0] = translateStartX - 0.005 * (mouseButtonStartX - event.pageX);
            if (!event.shiftKey) {
              modelPosition.f[2] = translateStartZ - 0.005 * (mouseButtonStartY - event.pageY);
            } else {
              modelPosition.f[1] = translateStartY + 0.005 * (mouseButtonStartY - event.pageY);
            }
          }
        } else if (mInteractionState === InteractionState.HorizontalRotate) {
          const addRotX = new Matrix4();
          addRotX.rotationYMatrix(((mouseButtonStartX - event.pageX) * -0.005));
          modelRot = rotationStart.multiple(addRotX);
        } else if (mInteractionState === InteractionState.HorizontalTranslate) {
          modelPosition.f[0] = translateStartX - 0.005 * (mouseButtonStartX - event.pageX);
          modelPosition.f[2] = translateStartZ - 0.005 * (mouseButtonStartY - event.pageY);
        } else if (mInteractionState === InteractionState.VerticalTranslate) {
          modelPosition.f[0] = translateStartX - 0.005 * (mouseButtonStartX - event.pageX);
          modelPosition.f[1] = translateStartY + 0.005 * (mouseButtonStartY - event.pageY);
        } else if (mInteractionState === InteractionState.Scale) {
          modelPosition.f[0] = translateStartX - 0.005 * (mouseButtonStartX - event.pageX);
          modelScaleFactor = scaleStartX * 1.0 + 0.002 * (mouseButtonStartY - event.pageY);
        }
      }
      // event.preventDefault();
      // return true;
    };

    PlotterLib.mouseUp = function mouseUp(event) {
      // console.log('Mouse up');
      mouseButtonPressed = false;
      if (mInteractionState === InteractionState.Normal) {
        rotationStart.setMatrixData(modelRot.m); // ??
        translateStartX = 0;
        translateStartY = 0;
        translateStartZ = 0;
      } else if (mInteractionState === InteractionState.HorizontalRotate) {
        rotationStart.setMatrixData(modelRot.m); // ??
      } else if (mInteractionState === InteractionState.HorizontalTranslate) {
        translateStartX = 0;
        translateStartY = 0;
        translateStartZ = 0;
      } else if (mInteractionState === InteractionState.VerticalsTranslate) {
        translateStartX = 0;
        translateStartY = 0;
        translateStartZ = 0;
      } else if (mInteractionState === InteractionState.Scale) {
        scaleStartX = 1.0;
      }
      // event.preventDefault();
      // return true;
    };

    PlotterLib.mouseWheel = function mouseWheel(event) {
      // console.log('mouse wheel');
      const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
      console.log(`delta is ${delta}`);
      modelScaleFactor *= 1.0 + 0.02 * delta;
    };

    PlotterLib.changeColor = function changeColor(color, alpha) {
      document.body.style.backgroundColor = color;
      const rgb = hexToRgb(color);
      clearColor = [rgb.r / 255, rgb.g / 255, rgb.b / 255, alpha / 255];
    };

    function updateLegend(maxv, minv) {
      let ctx = legend.getContext('2d');
      let h = legend.height;
      let w = legend.width;
      ctx.fillStyle = "black"
      ctx.fillRect(0,0,w,h);
      for(let i=0; i<w; i++){
        const color = getPseudoColor(i/w);
        const cname =  'rgba('+Math.ceil(color.red*255)+','+Math.ceil(color.green*255)+','+Math.ceil(color.blue*255)+',1.0)';
        console.log("Color name "+cname);
        ctx.strokeStyle =cname;
        ctx.beginPath();
        ctx.moveTo(i,0);
        ctx.lineTo(i,h);
        ctx.stroke();
      }
      //ctx.font = "30px Comic Sans MS";
      ctx.font = "8px"
      ctx.fillStyle = 'white';
      ctx.textAlign = "center";
      ctx.rotate(-Math.PI/2);
      ctx.fillText(""+maxv.toFixed(2),-h/2,w);
      ctx.fillText(""+minv.toFixed(2),-h/2,0+8);

      legendtex = makeTexture(legend);
    }

    function initLegend(gl){
      let legendvertex=`
precision highp float;
attribute vec2 pos;
attribute vec2 texCoord;
varying vec2 v_TexCoordinate;
void main() {
    v_TexCoordinate = vec2(texCoord.x,1.0-texCoord.y);
    gl_Position = vec4(pos,0.0,1.0);
}
`;
      let legendfragment=`
precision highp float;
uniform sampler2D uTexture0;
varying vec2 v_TexCoordinate;
void main () {
    gl_FragColor =  texture2D(uTexture0, v_TexCoordinate);
}
`;

      legendprogram = ShaderLib.makeProgram2(gl, legendvertex, legendfragment);
      gl.useProgram(legendprogram);
      legendprogram.vertexCoords = gl.getAttribLocation(legendprogram, 'pos');
      legendprogram.texCoords = gl.getAttribLocation(legendprogram, 'texCoord');
      legendprogram.uTexture0 =  gl.getUniformLocation(legendprogram, 'uTexture0');
      legendvertexbuffer =gl.createBuffer();

      gl.bindBuffer(gl.ARRAY_BUFFER, legendvertexbuffer);
      const ratio= 16/9;
      const height = 1/10;
      const width = height*300/80*ratio;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1-width, 1-height, 1, 1-height, 1-width, 1, 1, 1
      ]), gl.STATIC_DRAW);

      legendtexcoordsbuffer =gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, legendtexcoordsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1
      ]), gl.STATIC_DRAW);

    }

    function drawLegend(gl){

      if(legendtex === undefined) return;
      gl.useProgram(legendprogram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, legendtex);
      gl.uniform1i(legendprogram.uTexture0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, legendvertexbuffer);
      gl.enableVertexAttribArray(legendprogram.vertexCoords);
      gl.vertexAttribPointer(legendprogram.vertexCoords, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, legendtexcoordsbuffer);
      gl.enableVertexAttribArray(legendprogram.texCoords);
      gl.vertexAttribPointer(legendprogram.texCoords, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function makeTexture(textCanvas){
      var textWidth  = textCanvas.width;
      var textHeight = textCanvas.height;
      var textTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, textTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
      // make sure we can render it even if it's not a power of 2
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return textTex;
    }

    PlotterLib.startdice = function startdice() {
      gravity = new Vec3(0, -9.81, 0);
      acceleration = new Vec3(0, 0, 0);
      garray = [];

      for (let i = 0; i < garraycount; i++) {
        garray.push(0);
        garray.push(-9.81);
        garray.push(0);
      }

      canvas = document.getElementById('glcanvas'); // eslint-disable-line no-undef
      legend = document.getElementById('legend');

      const tresholdslider = document.getElementById('tresholdslider'); // eslint-disable-line no-undef
      const colorinput = document.getElementById('colorinput'); // eslint-disable-line no-undef
      const alphaslider = document.getElementById('alphaslider'); // eslint-disable-line no-undef
      const filedialog = document.getElementById('inputfiledialog'); // eslint-disable-line no-undef

      // onchange="function test(e){ console.log('HEllo'); PlotterLib.addRadioDataSet(e.target.files[0]); };"
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      recordButton = document.getElementById('recordButton');
      playButton = document.getElementById('playButton');
      downloadButton = document.getElementById('downloadButton');

      recordButton.onclick = toggleRecording;
      playButton.onclick = play;
      downloadButton.onclick = download;


      filedialog.addEventListener('change', (e) => { PlotterLib.addRadioDataSet(e.target.files[0]); }, true);
      tresholdslider.onchange = function tresholdChange() {
        tresholdvalue = tresholdslider.value;
      };

      alphaslider.onchange = colorinput.onchange = function colorInputChange() {
        console.log(`new color ${colorinput.value} ${alphaslider.value}`);
        PlotterLib.changeColor(colorinput.value, alphaslider.value);
      };

      canvas.oncontextmenu = e => false;
      if (canvas.addEventListener) {
        canvas.addEventListener('mousedown', PlotterLib.mouseDown, true);
        canvas.addEventListener('mouseup', PlotterLib.mouseUp, true);
        canvas.addEventListener('mousemove', PlotterLib.mouseMove, true);
        canvas.addEventListener('mousewheel', PlotterLib.mouseWheel, false);
        canvas.addEventListener('DOMMouseScroll', PlotterLib.mouseWheel, false);
      }
      canvas.onkeypress = function onkeypress(e) {
        if (e.key === 'n') {
          mInteractionState = InteractionState.Normal;
        } else if (e.key === 'h') {
          mInteractionState = InteractionState.HorizontalTranslate;
        } else if (e.key === 'v') {
          mInteractionState = InteractionState.VerticalTranslate;
        } else if (e.key === 'r') {
          mInteractionState = InteractionState.HorizontalRotate;
        } else if (e.key === 's') {
          mInteractionState = InteractionState.Scale;
        } else if (e.key === '+') {
          fi++;
          if (fi >= frequencyArray.length) fi = 0;
          cf = frequencyArray[fi];
          console.log(`frequency is ${cf}`);
        }
        console.log(`keypressed ${e.key}`);
      };

      canvas.onkeyup = function onkeyup(e) {
        console.log(`keyup ${e}`);
      };


      canvas.ondragover = function allowdrop(ev) {
        ev.preventDefault();
        console.log('ondragover');
      };
      canvas.ondrop = function ondrop(ev) {
        ev.preventDefault();
        console.log('ondrop');
        const dt = ev.dataTransfer;
        if (dt.items) {
            // Use DataTransferItemList interface to access the file(s)
          for (let i = 0; i < dt.items.length; i++) {
            if (dt.items[i].kind === 'file') {
              const f = dt.items[i].getAsFile();
              console.log(`... file[${i}].name = ${f.name}`);
              if (f.name.endsWith('histogram')) {
                console.log('histogram file');
                PlotterLib.addHistogramSet(f);
              } else if (f.name.endsWith('txt')) {
                console.log('radio data set');
                PlotterLib.addRadioDataSet(f);
              }
            }
          }
        } else {
            // Use DataTransfer interface to access the file(s)
          for (let i = 0; i < dt.files.length; i++) {
            console.log(`... file[${i}].name = ${dt.files[i].name}`);
            // PassKameraLib.addVideoFileElement(dt.files[i]);
          }
        }
      };

      canvas.dragend = function dragend(ev) {
        ev.preventDefault();
        const dt = ev.dataTransfer;
        if (dt.items) {
          // Use DataTransferItemList interface to remove the drag data
          for (let i = 0; i < dt.items.length; i++) {
            dt.items.remove(i);
          }
        } else {
          // Use DataTransfer interface to remove the drag data
          ev.dataTransfer.clearData();
        }
      };

      aspectRatio = canvas.width / canvas.height;
      wallx = (0.5 / canvas.height) * canvas.width * 2.0; // todo remove repeat
      wallz = 1.0;
      WallLib.setWalls(wallx, wallz, floorheight); // eslint-disable-line no-undef
      // MouseLib.setCanvas(canvas, aspectRatio, fov); // eslint-disable-line no-undef

      canvas.addEventListener('mousedown', PlotterLib.mouseDown, false);
      canvas.addEventListener('mouseup', PlotterLib.mouseUp, false);
      canvas.addEventListener('mousemove', PlotterLib.mouseMove, false);
      document.body.addEventListener('touchstart', (e) => { // eslint-disable-line no-undef
        if (e.target === canvas) {
          e.preventDefault();
        }
      }, false);
      document.body.addEventListener('touchend', (e) => { // eslint-disable-line no-undef
        if (e.target === canvas) {
          e.preventDefault();
        }
      }, false);
      document.body.addEventListener('touchmove', (e) => { // eslint-disable-line no-undef
        if (e.target === canvas) {
          e.preventDefault();
        }
      }, false);

      canvas.addEventListener('touchstart', PlotterLib.touchDown, false);
      canvas.addEventListener('touchend', PlotterLib.touchUp, false);
      canvas.addEventListener('touchmove', PlotterLib.touchMove, false);
      // numberx = document.getElementById('number'); // eslint-disable-line no-undef
      // planeConstraints = WallLib.makeWalls(); // eslint-disable-line no-undef
      // Initialize the GL context
      gl = initWebGL(canvas);

      initLegend(gl);
      axis = new AxisLib.AxisRenderer(gl);

      // stream = canvas.captureStream(); // frames per second

      modelTrans.translate(modelPosition.f[0], modelPosition.f[1], modelPosition.f[2]);
      console.log('Started stream capture from canvas element: ', stream);
      // Only continue if WebGL is available and working
      if (gl) {
        programsphere = ShaderLib.makeProgram(gl, // eslint-disable-line no-undef
          'vertexsphere', 'fragmentsphere');
        programsphere.uPMatrix = gl.getUniformLocation(programsphere, 'uPMatrix');
        programsphere.uMMatrix = gl.getUniformLocation(programsphere, 'uMMatrix');
        programsphere.uVMatrix = gl.getUniformLocation(programsphere, 'uVMatrix');
        programsphere.uPos = gl.getUniformLocation(programsphere, 'uPos');
        programsphere.uRadius = gl.getUniformLocation(programsphere, 'uRadius');
        programsphere.uColor = gl.getUniformLocation(programsphere, 'uColor');
        programsphere.aVert = gl.getAttribLocation(programsphere, 'aVert');
        programsphere.aNormal = gl.getAttribLocation(programsphere, 'aNormal');

        program = ShaderLib.makeProgram(gl, // eslint-disable-line no-undef
          'vertex', 'fragment');

        WallLib.createBuffers(gl); // eslint-disable-line no-undef
        // createDices();

        program.uPerspectiveMatrix = gl.getUniformLocation(program, 'projection');
        program.uCamera = gl.getUniformLocation(program, 'camera');
        program.uModel = gl.getUniformLocation(program, 'model');
        program.uView = gl.getUniformLocation(program, 'view');
        program.uNormalMat = gl.getUniformLocation(program, 'normalMat');
        program.uLightPos = gl.getUniformLocation(program, 'uLightPos');
        program.aVertexPosition = gl.getAttribLocation(program, 'inputPosition');
        program.aNormalPosition = gl.getAttribLocation(program, 'inputNormal');
        program.aTextureCoordsPosition = gl.getAttribLocation(program, 'textureCoords');
        program.aTextureCoordsPosition3d = gl.getAttribLocation(program, 'textureCoords3d');
        program.uSampler = gl.getUniformLocation(program, 'uSampler');
        program.uColor = gl.getUniformLocation(program, 'uColor');
        program.uColor2 = gl.getUniformLocation(program, 'uColor2');
        program.uColor3 = gl.getUniformLocation(program, 'uColor3');
        program.uDice = gl.getUniformLocation(program, 'uDice');
        program.uTextureOffset = gl.getUniformLocation(program, 'uTextureOffset');

        hprogram = ShaderLib.makeProgram(gl, 'hvertex', 'hfragment');
        gl.useProgram(hprogram);
        hprogram.uPMatrix = gl.getUniformLocation(hprogram, 'uPMatrix');
        hprogram.uMMatrix = gl.getUniformLocation(hprogram, 'uMMatrix');
        hprogram.uVMatrix = gl.getUniformLocation(hprogram, 'uVMatrix');
        hprogram.uTreshold = gl.getUniformLocation(hprogram, 'uTreshold');
        hprogram.pos = gl.getAttribLocation(hprogram, 'pos');
        hprogram.size = gl.getAttribLocation(hprogram, 'size');
        hprogram.color = gl.getAttribLocation(hprogram, 'color');

        h2program = ShaderLib.makeProgram(gl, 'h2vertex', 'h2fragment');
        gl.useProgram(hprogram);
        h2program.uPMatrix = gl.getUniformLocation(h2program, 'uPMatrix');
        h2program.uMMatrix = gl.getUniformLocation(h2program, 'uMMatrix');
        h2program.uVMatrix = gl.getUniformLocation(h2program, 'uVMatrix');
        h2program.uNMatrix = gl.getUniformLocation(h2program, 'uNMatrix');
        h2program.uTreshold = gl.getUniformLocation(h2program, 'uTreshold');
        h2program.uCameraPos = gl.getUniformLocation(h2program, 'uCameraPos');
        h2program.uLightPos = gl.getUniformLocation(h2program, 'uLightPos');
        h2program.pos = gl.getAttribLocation(h2program, 'pos');
        h2program.size = gl.getAttribLocation(h2program, 'size');
        h2program.color = gl.getAttribLocation(h2program, 'color');
        h2program.normal = gl.getAttribLocation(h2program, 'normal');
        sphereRenderer = new SphereRenderer(gl);
        makeCamera();
        if (VrLib) {
          VrLib.initVR(canvas, runner, drawVRScene, gl, makeCamera);// eslint-disable-line no-undef
        }
        runner();
      }
    };
    return PlotterLib;
  }
  // define globally if it doesn't already exist
  if (typeof (PlotterLib) === 'undefined') {
    const mwindow = window;
    mwindow.PlotterLib = defineLibrary();
  }
}(window)); // eslint-disable-line no-undef
