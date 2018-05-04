

/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    //let legend;
    //let legendtex;
    let legendprogram;
    let legendvertexbuffer;
    let legendtexcoordsbuffer;
    const LegendLib = {};


        function makeTexture(textCanvas, gl){
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

     class Legend{

      constructor(gl, canvas,maxv,minv){
        this.legend = document.getElementById('legend');
        this.initLegend(gl,canvas);
        this.updateLegend(gl, maxv,minv);
      }

    updateLegend(gl, maxv, minv) {
      let ctx = legend.getContext('2d');
      let h = legend.height;
      let w = legend.width;
      ctx.fillStyle = "black"
      ctx.fillRect(0,0,w,h);
      for(let i=0; i<w; i++){
        const color = getPseudoColor(i/w);
        const cname =  'rgba('+Math.ceil(color.red*255)+','+Math.ceil(color.green*255)+','+Math.ceil(color.blue*255)+',1.0)';
        //console.log("Color name "+cname);
        ctx.strokeStyle =cname;
        ctx.beginPath();
        ctx.moveTo(i,0);
        ctx.lineTo(i,h/2);
        ctx.stroke();
      }
      ctx.font = "25px Arial";
      ctx.fillStyle = "rgba(255,0,0,1.0)";
      ctx.textAlign = "left";
      ctx.fillText("+ x-axis",0,h*4/6);
      ctx.fillStyle = "rgba(0,255,255,1.0)";
      ctx.fillText("- x-axis",w/2,h*4/6);

      ctx.fillStyle = "rgba(0,255,0,1.0)";
      ctx.fillText("+ y-axis",0,h*5/6);
      ctx.fillStyle = "rgba(255,0,255,1.0)";
      ctx.fillText("- y-axis",w/2,h*5/6);

      ctx.fillStyle = "rgba(0,0,255,1.0)";
      ctx.fillText("+ z-axis",0,h);
      ctx.fillStyle = "rgba(255,255,0,1.0)";
      ctx.fillText("- z-axis",w/2,h);

      //ctx.font = "30px Comic Sans MS";
      ctx.font = "10px Arial"
      ctx.fillStyle = 'white';
      ctx.textAlign = "center";
      ctx.rotate(-Math.PI/2);
      ctx.fillText(""+maxv.toFixed(2),-h/4,w);
      ctx.fillText(""+minv.toFixed(2),-h/4,0+8);

      this.legendtex = makeTexture(legend, gl);
    }

    initLegend(gl, canvas){
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

      this.updateLegendCoords(gl, canvas);
/*
      gl.bindBuffer(gl.ARRAY_BUFFER, legendvertexbuffer);
      const ratio= canvas.width/canvas.height;
      const height = 2*legend.height/canvas.height;
      const width = height*legend.width/legend.height/ratio;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1-width, 1-height, 1, 1-height, 1-width, 1, 1, 1
      ]), gl.STATIC_DRAW);
*/
      legendtexcoordsbuffer =gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, legendtexcoordsbuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1
      ]), gl.STATIC_DRAW);

    }

    updateLegendCoords(gl, canvas){
      gl.bindBuffer(gl.ARRAY_BUFFER, legendvertexbuffer);
      const ratio= canvas.width/canvas.height;
      const height = 2*this.legend.height/canvas.height;
      const width = height*this.legend.width/legend.height/ratio;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1-width, 1-height, 1, 1-height, 1-width, 1, 1, 1
      ]), gl.STATIC_DRAW);
    }

    drawLegend(gl){

      if(this.legendtex === undefined) return;
      gl.useProgram(legendprogram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.legendtex);
      gl.uniform1i(legendprogram.uTexture0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, legendvertexbuffer);
      gl.enableVertexAttribArray(legendprogram.vertexCoords);
      gl.vertexAttribPointer(legendprogram.vertexCoords, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, legendtexcoordsbuffer);
      gl.enableVertexAttribArray(legendprogram.texCoords);
      gl.vertexAttribPointer(legendprogram.texCoords, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

  }
  LegendLib.Legend = Legend;
    return LegendLib;
  }
  if (typeof (LegendLib) === 'undefined') window.LegendLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
