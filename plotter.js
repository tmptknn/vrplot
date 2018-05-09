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


    let dataSet;
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

    let vrOffsetMatrix;

    let running = true;
    let sphereRenderer;
    let pointcount = 0;


    let dataType = 0;

    let hprogram;
    let h2program;
/*
    let hsbuffer;
    let hcbuffer;
    let hpbuffer;
    let hibuffer;
    let hnbuffer;


    let stripes = 0;
    let stripePoints = 0;
*/


    //let histogramvisible = false;
    let tresholdvalue = 0.5;
    let takeshotwhenready = false;

    let wallsOn = false;
    let flatShadingOn = false;
    let pointsOn = false;
    let meshOn = true;
    let axisOn = true;
    let legendOn = true;
    let rotateOn = false;
    let clearColor = [0, 0, 0, 1];





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
    let modelAutoRot = new Matrix4();
    const modelScale = new Matrix4();
    const modelPreRotTrans = new Matrix4();
    const modelPostRotTrans = new Matrix4();
    let extraRotation = new Matrix4();
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
    let moveStartX = 0;
    let moveStartY = 0;
    let moveStartZ = 0;
    let scaleStartX = 1.0;
    let modelScaleFactor = 1.0;
    let autoRotationY=0.0;
    let autoRotationSpeed =0.01;


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

    PlotterLib.toggleAxis = function toggleAxis() {
      axisOn = !axisOn;
    };

    PlotterLib.toggleLegend = function toggleLegend() {
      legendOn = !legendOn;
    };

    function drawGeometry(mod,vie,cam,pro) {
      gl.useProgram(program);
      gl.uniformMatrix4fv(program.uModel, false, new Float32Array((vrOffsetMatrix).flatten()));
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

      if (dataSet && dataSet.valid === true) {
        gl.useProgram(hprogram);
        gl.uniform1f(hprogram.uTreshold, 0.0001 * tresholdvalue);
        if (dataSet.dataType === 0 || dataSet.dataType === 2 || dataSet.dataType === 120) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hsbuffer);
          gl.enableVertexAttribArray(hprogram.size);
          gl.vertexAttribPointer(hprogram.size, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hpbuffer);
          gl.enableVertexAttribArray(hprogram.pos);
          gl.vertexAttribPointer(hprogram.pos, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hcbuffer);
          gl.enableVertexAttribArray(hprogram.color);
          gl.vertexAttribPointer(hprogram.color, 3, gl.FLOAT, false, 0, 0);
          if (pointsOn)gl.drawArrays(gl.POINTS, 0, dataSet.pointcount);

        // console.log(`buffer length ${pointcount}`);


        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
        if(dataSet.dataType !== 120){
          if (!flatShadingOn) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dataSet.hibuffer);
            gl.useProgram(h2program);
            gl.uniform1f(h2program.uTreshold, 0.0001 * tresholdvalue);

            gl.uniform3fv(h2program.uCameraPos, cameraPos.f);
            gl.uniform3fv(h2program.uLightPos, [0.2, 10.0, 20.0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hsbuffer);
            // gl.enableVertexAttribArray(h2program.size);
            // gl.vertexAttribPointer(h2program.size, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hpbuffer);
            gl.enableVertexAttribArray(h2program.pos);
            gl.vertexAttribPointer(h2program.pos, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hcbuffer);
            gl.enableVertexAttribArray(h2program.color);
            gl.vertexAttribPointer(h2program.color, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hnbuffer);
            gl.enableVertexAttribArray(h2program.normal);
            gl.vertexAttribPointer(h2program.normal, 3, gl.FLOAT, false, 0, 0);
          // gl.drawArrays(gl.POINTS, 0, pointcount);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dataSet.hibuffer);
          }
        // console.log(`stripePoints ${stripePoints}`);
        // console.log(`Stripes ${stripes}`);
          if (meshOn) {
            for (let i = 0; i < dataSet.stripes; i++) {
          // console.log(`Drawing element ${i}`);
              gl.drawElements(gl.TRIANGLE_STRIP, dataSet.stripePoints, gl.UNSIGNED_SHORT, dataSet.stripePoints * i * 2);
            }
          }
        }
        } else if (dataSet.dataType === 1 && dataSet.cf !== 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hsbuffer[dataSet.cf]);
          gl.enableVertexAttribArray(hprogram.size);
          gl.vertexAttribPointer(hprogram.size, 1, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hpbuffer[dataSet.cf]);
          gl.enableVertexAttribArray(hprogram.pos);
          gl.vertexAttribPointer(hprogram.pos, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hcbuffer[dataSet.cf]);
          gl.enableVertexAttribArray(hprogram.color);
          gl.vertexAttribPointer(hprogram.color, 3, gl.FLOAT, false, 0, 0);
          if (pointsOn)gl.drawArrays(gl.POINTS, 0, dataSet.pointcount[dataSet.cf]);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dataSet.hibuffer[dataSet.cf]);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
          if (!flatShadingOn) {
            gl.useProgram(h2program);
            gl.uniform1f(h2program.uTreshold, 0.0001 * tresholdvalue);

            gl.uniform3fv(h2program.uCameraPos, cameraPos.f);
            gl.uniform3fv(h2program.uLightPos, [0.2, 10.0, 20.0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hsbuffer[dataSet.cf]);
            gl.enableVertexAttribArray(h2program.size);
            gl.vertexAttribPointer(h2program.size, 1, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hpbuffer[dataSet.cf]);
            gl.enableVertexAttribArray(h2program.pos);
            gl.vertexAttribPointer(h2program.pos, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hcbuffer[dataSet.cf]);
            gl.enableVertexAttribArray(h2program.color);
            gl.vertexAttribPointer(h2program.color, 3, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, dataSet.hnbuffer[dataSet.cf]);
            gl.enableVertexAttribArray(h2program.normal);
            gl.vertexAttribPointer(h2program.normal, 3, gl.FLOAT, false, 0, 0);
          // gl.drawArrays(gl.POINTS, 0, pointcount);
        // gl.drawArrays(gl.LINE_STRIP, 0, pointcount);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dataSet.hibuffer[dataSet.cf]);
          }
          // console.log(`stripePoints ${stripePoints2[cf]}`);
          // console.log(`Stripes ${stripes2[cf]}`);
          if (meshOn) {
            for (let i = 0; i < dataSet.stripes[dataSet.cf]; i++) {
          // console.log(`Drawing element ${i}`);
              gl.drawElements(gl.TRIANGLE_STRIP, dataSet.stripePoints[dataSet.cf], gl.UNSIGNED_SHORT, dataSet.stripePoints[dataSet.cf] * i * 2);
            }
          }
        }
      }
      if(axisOn) axis.draw(gl, mod,vie,cam,pro);
      if(dataSet !== undefined && dataSet.legend  !== undefined && legendOn) dataSet.legend.drawLegend(gl);
      checkGlError();
    }

    function refresh() {
      runPhysics();
      if(rotateOn === true){
        autoRotationY+=autoRotationSpeed;
        modelAutoRot.rotationYMatrix(autoRotationY);
      }
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
      modelTotal = modelScale.multiple(modelRot.multiple(modelAutoRot.multiple(modelTrans)));
      gl.uniformMatrix4fv(hprogram.uMMatrix, false, new Float32Array(modelTotal.flatten()));

      gl.useProgram(h2program);
      gl.uniformMatrix4fv(h2program.uPMatrix, false,
        new Float32Array(perspectiveMatrix.flatten())); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(h2program.uVMatrix, false,
        new Float32Array(cameraMatrix.flatten()));  // eslint-disable-line no-undef

      // modelRot.rotationYMatrix(angle);
      modelTrans.translate(modelPosition.f[0], modelPosition.f[1], modelPosition.f[2]);
      modelScale.scale(modelScaleFactor, modelScaleFactor, modelScaleFactor);
      modelTotal = modelScale.multiple(modelRot.multiple(modelAutoRot.multiple(modelTrans)));
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
    //  perspectiveMatrix.makePerspective(90, 16.0 / 9.0, 0.001, -100000.0);
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
      modelTrans.translate(modelPosition.f[0], modelPosition.f[1], modelPosition.f[2]);
      modelScale.scale(modelScaleFactor, modelScaleFactor, modelScaleFactor);
      modelTotal = modelScale.multiple(modelRot.multiple(extraRotation.multiple(modelAutoRot.multiple(modelTrans.multiple(vrOffsetMatrix)))));
      gl.uniformMatrix4fv(hprogram.uMMatrix, false, new Float32Array(modelTotal.flatten()));

      gl.useProgram(h2program);
      gl.uniformMatrix4fv(h2program.uPMatrix, false,
          VrLib.frameData.leftProjectionMatrix); // eslint-disable-line no-undef
      gl.uniformMatrix4fv(h2program.uVMatrix, false,
          VrLib.frameData.leftViewMatrix);  // eslint-disable-line no-undef
      // modelRot.rotationYMatrix(angle);

      //modelTotal = modelScale.multiple(modelRot.multiple(modelAutoRot.multiple(modelTrans)));
      const n0Matrix = cameraMatrix.multiple(modelTotal);
      // console.log(n0Matrix);
      const n1Matrix = n0Matrix.invert();
      // console.log(n1Matrix);
      const nMatrix = n1Matrix.transpose();
      gl.uniformMatrix4fv(h2program.uNMatrix, false, new Float32Array(nMatrix.flatten()));


      gl.uniformMatrix4fv(h2program.uMMatrix, false, new Float32Array(modelTotal.flatten()));
      drawGeometry(new Float32Array(modelTotal.flatten()),
        VrLib.frameData.leftViewMatrix,
        new Float32Array(im.flatten()),
        VrLib.frameData.leftProjectionMatrix);
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


      drawGeometry(new Float32Array(modelTotal.flatten()),
        VrLib.frameData.rightViewMatrix,
        new Float32Array(im.flatten()),
        VrLib.frameData.rightProjectionMatrix);
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
      perspectiveMatrix.makePerspective(fov, canvas.width / canvas.height, 0.001, 100.0);
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
      dataSet.legend.updateLegendCoords(gl, canvas);
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

    PlotterLib.scale = function scale(axis){
      console.log("scale "+axis);
      modelScaleFactor = modelScaleFactor * 1.0 + 0.002 * (axis);
    }


    function touchDown(event) {
      const x = (event.touches[0].clientX - canvas.offsetLeft) ;
      const y = (event.touches[0].clientY - canvas.offsetTop);
      PlotterLib.mouseDown({pageX:x,pageY:y, buttons:1})
    }

    function touchMove(event) {
      const x = (event.touches[0].clientX - canvas.offsetLeft) ;
      const y = (event.touches[0].clientY - canvas.offsetTop);
      PlotterLib.mouseMove({pageX:x,pageY:y, buttons:1})
    }

    function touchUp(event) {
      const x = (event.touches[0].clientX - canvas.offsetLeft) ;
      const y = (event.touches[0].clientY - canvas.offsetTop);
      PlotterLib.mouseUp({pageX:x,pageY:y, buttons:1})
    }


    PlotterLib.setStartPosition = function startMove(pos, ori){ // under work
      translateStartX = modelPosition.f[0];
      moveStartX = pos[0];
      translateStartY = modelPosition.f[1];
      moveStartY = pos[1];
      translateStartZ = modelPosition.f[2];
      moveStartZ = pos[2];

      const ma = new Matrix4();
      ma.rotationQMatrix(ori);
      extraRotation = ma;

    }

    PlotterLib.setPosition = function move(pos,ori ){ // under work
      modelPosition.f[0] = translateStartX + (pos[0]-moveStartX);
      modelPosition.f[1] = translateStartY + (pos[1]-moveStartY);
      modelPosition.f[2] = translateStartZ + (pos[2]-moveStartZ);

      const ma = new Matrix4();
      ma.rotationQMatrix(ori);
      extraRotation = ma;

    }

    PlotterLib.setEndPosition = function endMove(pos, ori){ // under work
      translateStartX = 0;
      translateStartY = 0;
      translateStartZ = 0;
      moveStartX = 0;
      moveStartY = 0;
      moveStartZ = 0;
      /*
      const ma = new Matrix4();
      ma.rotationQMatrix(ori);
      extraRotation = ma;
      */
    }

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

    function makeVRAdjustments(){
      legendOn = false;
      //modelPosition.f[2] -= 2.0;

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


      filedialog.addEventListener('change', (e) => {
        dataSet = DataReaderLib.addRadioDataSet(e.target.files[0], gl, canvas);
      }, true);
      tresholdslider.onchange = function tresholdChange() {
        tresholdvalue = tresholdslider.value;
      };

      alphaslider.onchange = colorinput.onchange = function colorInputChange() {
        //console.log(`new color ${colorinput.value} ${alphaslider.value}`);
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
        if(e.key === 'Escape'){
          console.log("hide ui????");
          document.getElementById('textlayer').visible = !document.getElementById('textlayer').visible;
        } else if (e.key === 'n') {
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
          dataSet.fi++;
          if (dataSet.fi >= dataSet.frequencyArray.length-1) dataSet.fi = 0;
          dataSet.cf = dataSet.frequencyArray[dataSet.fi];
          console.log(`frequency is ${dataSet.cf}`);
        }
        console.log(`keypressed ${e.key}`);
      };

      canvas.onkeyup = function onkeyup(e) {
        console.log(`keyup ${e.key}`);
        if(e.key === 'Escape' || e.key === 'p'){
          console.log("hide ui????");
          document.getElementById('textlayer').hidden = !document.getElementById('textlayer').hidden;
        }else if(e.key ==='t'){
          rotateOn=!rotateOn;
        }
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
                dataSet = DataReaderLib.addHistogramSet(f, gl);
              } else if (f.name.endsWith('txt')) {
                console.log('radio data set');
                dataSet = DataReaderLib.addRadioDataSet(f, gl, canvas);

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

      canvas.addEventListener('touchstart', touchDown, false);
      canvas.addEventListener('touchend', touchUp, false);
      canvas.addEventListener('touchmove', touchMove, false);
      // numberx = document.getElementById('number'); // eslint-disable-line no-undef
      // planeConstraints = WallLib.makeWalls(); // eslint-disable-line no-undef
      // Initialize the GL context
      gl = initWebGL(canvas);

      //initLegend(gl);
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

        var request = new XMLHttpRequest();
        request.open('GET', "data/libre.txt", true);
        request.responseType = 'blob';
        request.onload = function() {

            //var reader = new FileReader();
            //reader.readAsDataURL(request.response);
            //reader.onload =  function(e){
              //  const file = new Blob(e.target.result, {type : 'text/plain'});
                dataSet = DataReaderLib.addRadioDataSet(request.response, gl, canvas);
            //};


        };
        request.send();
        //dataSet = DataReaderLib.addRadioDataSet(File.createFromFileName("data/libre.txt"),gl);

        if (VrLib) {
          VrLib.initVR(canvas, runner, drawVRScene, gl, makeCamera, makeVRAdjustments);// eslint-disable-line no-undef
          vrOffsetMatrix = new Matrix4();
          vrOffsetMatrix.translate(0,0,-2);
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
