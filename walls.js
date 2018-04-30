/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const WallLib = {};
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    // const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    // const PlaneConstraint = MSLib.PlaneConstraint; // eslint-disable-line no-undef

    const walls = true;

    let gvbuffer = null;
    let gnbuffer = null;
    let gcbuffer = null;
    let gc3dbuffer = null;
    let gibuffer = null;

    let floorheight = -1.7;
    let wallx = 0.5;
    let wallz = 1.0;
    let groundTexture = null;

    WallLib.getWalls = function getWalls() {
      return walls;
    };

    WallLib.getWallX = function getWallX() {
      return wallx;
    };

    WallLib.getWallZ = function getWallZ() {
      return wallz;
    };

    WallLib.getFloorHeight = function getFloorHeight() {
      return floorheight;
    };

    WallLib.setWalls = function setWalls(x, z, h) {
      floorheight = h;
      wallx = x;
      wallz = z;
    };
/*
    WallLib.makeWalls = function makeWalls() {
      const planeConstraints = [];
      planeConstraints.push(new PlaneConstraint(new Vec3(0, floorheight, 0),
                                                new Vec3(0, floorheight, wallz),
                                                new Vec3(wallx, floorheight, 0)));

      if (walls) {
        planeConstraints.push(new PlaneConstraint(new Vec3(0, -floorheight, 0),
                                                new Vec3(wallx, -floorheight, 0),
                                                new Vec3(0, -floorheight, wallz)));


      // xwalls

        planeConstraints.push(new PlaneConstraint(new Vec3(wallx, floorheight, 0),
                                                new Vec3(wallx, floorheight, 1),
                                                new Vec3(wallx, floorheight + 1, 0)));
        planeConstraints.push(new PlaneConstraint(new Vec3(-wallx, floorheight, 0),
                                                new Vec3(-wallx, floorheight + 1, 0),
                                                new Vec3(-wallx, floorheight, 1)));

      // zwalls

        planeConstraints.push(new PlaneConstraint(new Vec3(0, floorheight, wallz),
                                                new Vec3(0, floorheight + 1, wallz),
                                                new Vec3(1, floorheight, wallz)));
      }
      planeConstraints.push(new PlaneConstraint(new Vec3(0, floorheight, -2 * wallz),
                                                new Vec3(wallx, floorheight, -2 * wallz),
                                                new Vec3(0, floorheight + 1, -2 * wallz)));
      return planeConstraints;
    };
    */

    WallLib.makeWallBuffers = function makeWallBuffers(gl) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gvbuffer);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([
          -wallx * 10, floorheight, -2 * wallz * 10, wallx * 10, floorheight, -2 * wallz * 10,
          -wallx * 10, floorheight, wallz * 10, wallx * 10, floorheight, wallz * 10,
          -wallx, -floorheight, wallz, wallx, floorheight, wallz,
          -wallx, -floorheight, wallz, wallx, floorheight, wallz,
          -wallx, -floorheight, -2 * wallz, -wallx, floorheight, -2 * wallz,
          wallx, -floorheight, -2 * wallz, wallx, floorheight, -2 * wallz,
          wallx, -floorheight, -2 * wallz, wallx, -floorheight, wallz,
          wallx, floorheight, -2 * wallz, wallx, floorheight, wallz,
          -wallx, -floorheight, -2 * wallz, -wallx, -floorheight, wallz,
          -wallx, floorheight, -2 * wallz, -wallx, floorheight, wallz,
        ]), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, gc3dbuffer);
      gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array([
            -wallx * 10, floorheight, -2 * wallz * 10, wallx * 10, floorheight, -2 * wallz * 10,
            -wallx * 10, floorheight, wallz * 10, wallx * 10, floorheight, wallz * 10,
            -wallx, -floorheight, wallz, wallx, floorheight, wallz,
            -wallx, -floorheight, wallz, wallx, floorheight, wallz,
            -wallx, -floorheight, -2 * wallz, -wallx, floorheight, -2 * wallz,
            wallx, -floorheight, -2 * wallz, wallx, floorheight, -2 * wallz,
            wallx, -floorheight, -2 * wallz, wallx, -floorheight, wallz,
            wallx, floorheight, -2 * wallz, wallx, floorheight, wallz,
            -wallx, -floorheight, -2 * wallz, -wallx, -floorheight, wallz,
            -wallx, floorheight, -2 * wallz, -wallx, floorheight, wallz,
          ]), gl.STATIC_DRAW);
    };

    WallLib.createBuffers = function createBuffers(gl) {
      gvbuffer = gl.createBuffer();
      gc3dbuffer = gl.createBuffer();
      WallLib.makeWallBuffers(gl);

      gnbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gnbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      ]), gl.STATIC_DRAW);

      gcbuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, gcbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
        0, 0, 1, 0, 0, 1, 1, 1,
      ]), gl.STATIC_DRAW);

      gibuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gibuffer);
      if (walls) {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 2, 3,
          // 4, 5, 6, 5, 6, 7,
          8, 9, 10, 9, 10, 11,
          12, 13, 14, 13, 14, 15,
          16, 17, 18, 17, 18, 19,
        ]), gl.STATIC_DRAW);
      } else {
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 1, 2, 3,
          // 4, 5, 6, 5, 6, 7,
          //8, 9, 10, 9, 10, 11,
          //12, 13, 14, 13, 14, 15,
          //16, 17, 18, 17, 18, 19,
        ]), gl.STATIC_DRAW);
      }
    };

    function handleTextureLoaded(gl, image, texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    WallLib.initTextures = function initTextures(gl) {
      const w = 128;
      const h = 128;

      const canvas = document.createElement('canvas'); // eslint-disable-line no-undef
      canvas.width = w;
      canvas.height = h;
      const ctx2 = canvas.getContext('2d');
      ctx2.fillStyle = '#00000000';
      ctx2.clearRect(0, 0, w, h);
      for (let i = 0; i < w; i += 1) {
        for (let j = 0; j < h; j += 1) {
          // const intensity = Math.floor(Math.random() * 32) + 32;
          /*
          ctx2.fillStyle = 'rgba('.concat(intensity).concat(',').concat(intensity + 64).concat(',')
          .concat(intensity)
          .concat(',').concat(1.0).concat(')');
          */
          ctx2.fillStyle = 'rgba(0,0,0,0)';
          ctx2.fillRect(i, j, 1, 1);
        }
      }
      groundTexture = gl.createTexture();
      // DiceTexturesLib // eslint-disable-line no-undef
      handleTextureLoaded(gl, canvas, groundTexture);
    };

    WallLib.drawWalls = function drawWalls(gl, program) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, groundTexture);
      gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0); // todo fix this

      gl.bindBuffer(gl.ARRAY_BUFFER, gvbuffer);
      gl.enableVertexAttribArray(program.aVertexPosition);
      gl.vertexAttribPointer(program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, gnbuffer);
      gl.enableVertexAttribArray(program.aNormalPosition);
      gl.vertexAttribPointer(program.aNormalPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, gcbuffer);
      gl.enableVertexAttribArray(program.aTextureCoordsPosition);
      gl.vertexAttribPointer(program.aTextureCoordsPosition, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, gc3dbuffer);
      gl.enableVertexAttribArray(program.aTextureCoordsPosition3d);
      gl.vertexAttribPointer(program.aTextureCoordsPosition3d, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gibuffer);
      gl.drawElements(gl.TRIANGLES, (walls) ? 24 : 6, gl.UNSIGNED_SHORT, 0);
    };

    return WallLib;
  }
  if (typeof (WallLib) === 'undefined') window.WallLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
