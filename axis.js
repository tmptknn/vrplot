/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    const AxisLib = {};

    function makeTexture(textCanvas,gl){
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

    function makeLabel(text,gl) {
      const canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      let h = 20;
      let w = 20;
      ctx.fillRect(0,0,w,h);
      //ctx.font = "30px Comic Sans MS";
      ctx.font = "8px"
      ctx.fillStyle = 'white';
      ctx.textAlign = "center";
      ctx.fillText(text,w/2,0);

      return makeTexture(legend,gl);
    }

    class AxisRenderer {
      constructor(gl){
        this.gl = gl;
        let vertex=`
  precision highp float;
  attribute vec3 pos;
  uniform mat4 projection,model, view, camera;
  void main() {
      gl_Position = projection*view*camera*model*vec4(pos,1.0);
  }
  `;
        let fragment=`
  precision highp float;
  void main () {
      gl_FragColor =  vec4(1.0,1.0,1.0,1.0);
  }
  `;

        this.program = ShaderLib.makeProgram2(gl, vertex, fragment);
        gl.useProgram(this.program);
        this.program.vertexCoords = gl.getAttribLocation(this.program, 'pos');
        this.program.uCamera = gl.getUniformLocation(this.program, 'camera');
        this.program.uModel = gl.getUniformLocation(this.program, 'model');
        this.program.uView = gl.getUniformLocation(this.program, 'view');
        this.program.uProjection = gl.getUniformLocation(this.program, 'projection');
        this.vertexbuffer =gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array([0,0,0,
            2,0,0,
            0,0,0,
            -2,0,0,
            0,0,0,
            0,2,0,
            0,0,0,
            0,-2,0,
            0,0,0,
            0,0,2,
            0,0,0,
            0,0,-2]),
          gl.STATIC_DRAW);

        gl.enableVertexAttribArray(this.program.vertexCoords);
        gl.vertexAttribPointer(this.program.vertexCoords, 3, gl.FLOAT, false, 0, 0);
        this.initLabels(gl);

      }

      initLabels(gl,){
        this.labelx = makeLabel("X",gl);


        let labelvertex=`
  precision highp float;
  uniform mat4 projection,model, view, camera;
  attribute vec3 pos;
  attribute vec2 texCoord;
  varying vec2 v_TexCoordinate;
  void main() {
    v_TexCoordinate = vec2(texCoord.x,1.0-texCoord.y);
      gl_Position = projection*view*camera*model*vec4(pos,1.0);
  }
  `;
        let labelfragment=`
  precision highp float;
  uniform sampler2D uTexture0;
  varying vec2 v_TexCoordinate;
  void main () {
      gl_FragColor =  texture2D(uTexture0, v_TexCoordinate);
  }
  `;
        this.labelprogram = ShaderLib.makeProgram2(gl, labelvertex, labelfragment);
        gl.useProgram(this.labelprogram);

      }

      drawLabel(gl,label,model,view,camera,projection) {
        /*
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.program.uCamera,0,camera);
        gl.uniformMatrix4fv(this.program.uView,0,view);
        gl.uniformMatrix4fv(this.program.uModel,0,model);
        gl.uniformMatrix4fv(this.program.uProjection,0,projection);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.enableVertexAttribArray(this.program.vertexCoords);
        gl.vertexAttribPointer(this.program.vertexCoords, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 12);
        */
      }

      draw(gl,model,view,camera,projection) {
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.program.uCamera,0,camera);
        gl.uniformMatrix4fv(this.program.uView,0,view);
        gl.uniformMatrix4fv(this.program.uModel,0,model);
        gl.uniformMatrix4fv(this.program.uProjection,0,projection);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
        gl.enableVertexAttribArray(this.program.vertexCoords);
        gl.vertexAttribPointer(this.program.vertexCoords, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.LINES, 0, 12);

        this.drawLabel(gl,this.labelx,model,view,camera,projection);
      }
    }



    AxisLib.AxisRenderer = AxisRenderer;
    return AxisLib;
  }
  if (typeof (AxisLib) === 'undefined') window.AxisLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
