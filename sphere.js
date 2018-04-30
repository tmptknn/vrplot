/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    const SphereLib = {};
    class SphereRenderer {
      constructor(glx) {
        this.gl = glx;
        this.vbuffer = null;
        this.nbuffer = null;
        this.subdivision = 20;

        this.createData();
        this.initData();
        this.createGLBuffers();
      }

      createData() {
        const nt = 3 * 3 * 2 * this.subdivision * this.subdivision;
        this.ntri = nt / 3;
        this.vertexData = new Float32Array(nt);
        this.normalData = new Float32Array(nt);
      }

      createGLBuffers() {
        const glx = this.gl;

        this.vbuffer = glx.createBuffer();
        glx.bindBuffer(glx.ARRAY_BUFFER, this.vbuffer);
        glx.bufferData(glx.ARRAY_BUFFER, this.vertexData, glx.STATIC_DRAW);

        this.nbuffer = glx.createBuffer();
        glx.bindBuffer(glx.ARRAY_BUFFER, this.nbuffer);
        glx.bufferData(glx.ARRAY_BUFFER, this.normalData, glx.STATIC_DRAW);
      }

      draw(program, vrcontrollers, vrcontrollerIds) {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuffer);
        gl.enableVertexAttribArray(program.aVert);
        gl.vertexAttribPointer(program.aVert, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbuffer);
        gl.enableVertexAttribArray(program.aNormal);
        gl.vertexAttribPointer(program.aNormal, 3, gl.FLOAT, false, 0, 0);

        for (let i = 0; i < vrcontrollerIds.length; i++) {
          const index = vrcontrollerIds[i];
          if (vrcontrollers[index].position != null) {
            gl.uniform3fv(program.uPos, new Float32Array(vrcontrollers[index].position));
            gl.uniform1f(program.uRadius, vrcontrollers[index].radius);
            gl.uniform3fv(program.uColor, new Float32Array(vrcontrollers[index].color));
            gl.drawArrays(gl.TRIANGLES, 0, this.ntri);

            const dir = new Vec3(0, 0, -vrcontrollers[index].radius);
            const ma = new Matrix4();
            ma.rotationQMatrix(vrcontrollers[index].orientation);
            const d = ma.multipleV(dir);
            const v = [vrcontrollers[index].position[0] + d.f[0],
              vrcontrollers[index].position[1] + d.f[1],
              vrcontrollers[index].position[2] + d.f[2]];

            gl.uniform3fv(program.uPos, new Float32Array(v));
            gl.uniform1f(program.uRadius, vrcontrollers[index].radius / 2.0);
            gl.uniform3fv(program.uColor, new Float32Array(vrcontrollers[index].color));
            gl.drawArrays(gl.TRIANGLES, 0, this.ntri);
          }
        }
      }

      initData() {
        let offset = 0;
        let noffset = 0;
        for (let i = 0; i < this.subdivision; i++) {
          let height = (Math.PI * i) / this.subdivision;
          let height1 = (Math.PI * (i + 1)) / this.subdivision;
          const width = Math.sin(height);
          const width1 = Math.sin(height1);
          height = Math.cos(height);
          height1 = Math.cos(height1);
          for (let j = 0; j < this.subdivision; j++) {
            const angle = (Math.PI * 2.0 * j) / this.subdivision;
            const angle2 = (Math.PI * 2.0 * (j + 1)) / this.subdivision;
            this.vertexData[offset++] = Math.sin(angle) * width;
            this.vertexData[offset++] = Math.cos(angle) * width;
            this.vertexData[offset++] = height;
            this.vertexData[offset++] = Math.sin(angle2) * width;
            this.vertexData[offset++] = Math.cos(angle2) * width;
            this.vertexData[offset++] = height;
            this.vertexData[offset++] = Math.sin(angle) * width1;
            this.vertexData[offset++] = Math.cos(angle) * width1;
            this.vertexData[offset++] = height1;
            this.vertexData[offset++] = Math.sin(angle) * width1;
            this.vertexData[offset++] = Math.cos(angle) * width1;
            this.vertexData[offset++] = height1;
            this.vertexData[offset++] = Math.sin(angle2) * width;
            this.vertexData[offset++] = Math.cos(angle2) * width;
            this.vertexData[offset++] = height;
            this.vertexData[offset++] = Math.sin(angle2) * width1;
            this.vertexData[offset++] = Math.cos(angle2) * width1;
            this.vertexData[offset++] = height1;

            this.normalData[noffset++] = Math.sin(angle) * width;
            this.normalData[noffset++] = Math.cos(angle) * width;
            this.normalData[noffset++] = height;
            this.normalData[noffset++] = Math.sin(angle2) * width1;
            this.normalData[noffset++] = Math.cos(angle2) * width1;
            this.normalData[noffset++] = height;
            this.normalData[noffset++] = Math.sin(angle) * width;
            this.normalData[noffset++] = Math.cos(angle) * width;
            this.normalData[noffset++] = height1;
            this.normalData[noffset++] = Math.sin(angle) * width1;
            this.normalData[noffset++] = Math.cos(angle) * width1;
            this.normalData[noffset++] = height1;
            this.normalData[noffset++] = Math.sin(angle2) * width;
            this.normalData[noffset++] = Math.cos(angle2) * width;
            this.normalData[noffset++] = height;
            this.normalData[noffset++] = Math.sin(angle2) * width1;
            this.normalData[noffset++] = Math.cos(angle2) * width1;
            this.normalData[noffset++] = height1;
          }
        }
      }
    }

    SphereLib.SphereRenderer = SphereRenderer;
    return SphereLib;
  }
  if (typeof (SphereLib) === 'undefined') window.SphereLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
