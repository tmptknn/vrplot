/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const ShaderLib = {};

    ShaderLib.makeProgram = function makeProgram(gl, vertexshadernode, fragmentshadernode) {
      const vb = document.getElementById(vertexshadernode) // eslint-disable-line no-undef
        .firstChild.nodeValue;
      const fb = document.getElementById(fragmentshadernode) // eslint-disable-line no-undef
        .firstChild.nodeValue;

      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, vb);
      gl.compileShader(vs);

      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, fb);
      gl.compileShader(fs);

      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vs)); // eslint-disable-line no-console
      }

      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fs)); // eslint-disable-line no-console
      }

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program)); // eslint-disable-line no-console
      }
      return program;
    };

    return ShaderLib;
  }
  if (typeof (ShaderLib) === 'undefined') window.ShaderLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
