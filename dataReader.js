/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const Matrix4 = VemaLib.Matrix4; // eslint-disable-line no-undef
    const Vec3 = VemaLib.Vec3; // eslint-disable-line no-undef
    const DataReaderLib = {};

    const frequencyArray = [];
    const stripes2 = {};
    const stripePoints2 = {};
    const hsbuffer2 = {};
    const hcbuffer2 = {};
    const hpbuffer2 = {};
    const hibuffer2 = {};
    const hnbuffer2 = {};
        const pointcount2 = {};

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

    DataReaderLib.addRadioDataSet = function addRadioDataSet(file, gl, canvas) {
      const dataSet = { dataType:0, valid:true, pointcount:0, maxv:0, minv:0, fi:0};

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
          } else if(splitStringBuffer[i].startsWith('Frequency')){
            dataType = 2;
            datastart = i + 1;
          }
        }

        console.log("DATATYPE = "+dataType);
        if (dataType === 2) {
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
            const azimuth = parseFloat(splitLine[1]);
          // angleArray[i * 2] = azimuth;
            const elevation = parseFloat(splitLine[2]);
          // angleArray[(i * 2) + 1] = elevation;
            const value = parseFloat(splitLine[3]);
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
          let stripes = 0;
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
          let stripePoints = 2 * maxpoints;

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
          console.log(`points after change ${counter}`);
          console.log(`max x ${maxx} y ${maxy} z ${maxz} v ${maxv}`);
          console.log(`indexBuffer ${indexBuffer}`);

          console.log('Calculated'); // ${maximumf} ${mrf} ${mgf} ${mbf}
        // gl.useProgram(hprogram);
          const hsbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datavaluebuffer, gl.STATIC_DRAW);

          const hcbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datacolorbuffer, gl.STATIC_DRAW);

          const hpbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datapositionbuffer, gl.STATIC_DRAW);

          const hnbuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, hnbuffer);
          gl.bufferData(gl.ARRAY_BUFFER, datanormalbuffer, gl.STATIC_DRAW);

          const hibuffer = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hibuffer);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW);



          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          dataSet.stripes = stripes;
          dataSet.stripePoints = stripePoints;
          dataSet.hsbuffer = hsbuffer;
          dataSet.hcbuffer = hcbuffer;
          dataSet.hpbuffer = hpbuffer;
          dataSet.hnbuffer = hnbuffer;
          dataSet.hibuffer = hibuffer;
          dataSet.pointcount = dataLength;
          dataSet.minv = minv;
          dataSet.maxv = maxv;
          dataSet.legend = new LegendLib.Legend(gl, canvas, dataSet.maxv, dataSet.minv);
          dataSet.valid  = true;
          console.log('READY OR NOTZ');
          //updateLegend(maxv,minv);
        } else if (dataType === 0) {
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
          let stripes = 0;
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
          let stripePoints = 2 * maxpoints;

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
          dataSet.stripes = stripes;
          dataSet.stripePoints = stripePoints;
          dataSet.hsbuffer = hsbuffer;
          dataSet.hcbuffer = hcbuffer;
          dataSet.hpbuffer = hpbuffer;
          dataSet.hnbuffer = hnbuffer;
          dataSet.hibuffer = hibuffer;
          dataSet.pointcount = dataLength;
          dataSet.minv = minv;
          dataSet.maxv = maxv;
          dataSet.legend = new LegendLib.Legend(gl, canvas, dataSet.maxv, dataSet.minv);
          dataSet.valid  = true;
          console.log('READY OR NOT');
          //updateLegend(maxv,minv);
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
          //dataSet.stripes = stripes;
          //dataSet.stripePoints = stripePoints;
          dataSet.stripes = stripes2;
          dataSet.stripePoints = stripePoints2;
          dataSet.hsbuffer = hsbuffer2;
          dataSet.hcbuffer = hcbuffer2;
          dataSet.hpbuffer = hpbuffer2;
          dataSet.hnbuffer = hnbuffer2;
          dataSet.hibuffer = hibuffer2;
          dataSet.pointcount = dataLength;
          dataSet.dataType = 1;
          dataSet.valid  = true;
          dataSet.minv = minv2[0];
          dataSet.maxv = maxv2[0];
          dataSet.cf = frequencyArray[0];
          dataSet.frequencyArray = frequencyArray;
          dataSet.legend = new LegendLib.Legend(gl, canvas, dataSet.maxv, dataSet.minv);
          //histogramvisible = true;
          //cf = frequencyArray[0];
          console.log('READY OR NOT2');
          //updateLegend(maxv2[0],minv2[0]);
        }

      };
      reader.onerror = function () {
        console.log('Danger will robinson');
      };
      reader.readAsText(file);
      return dataSet;
    };

    DataReaderLib.addHistogramSet = function addHistogramSet(file, gl) {
      const histogram = null;// new Uint32Array(256 * 256 * 256);
      const dataSet = { dataType:120, valid:true, pointcount:0, maxv:0, minv:0, fi:0};

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
        // gl.useProgram(hprogram);
        let hsbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hsbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogrambuffer, gl.STATIC_DRAW);

        let hcbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hcbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogramcolorbuffer, gl.STATIC_DRAW);

        let hpbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hpbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, histogrampositionbuffer, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        let pointcount = 256 * 256 * 256;
        //histogramvisible = true;

        dataSet.hsbuffer = hsbuffer;
        dataSet.hcbuffer = hcbuffer;
        dataSet.hpbuffer = hpbuffer;
        dataSet.pointcount = pointcount;
        dataSet.valid = true;
        dataSet.legend = new LegendLib.Legend(gl, canvas, dataSet.maxv, dataSet.minv);
        console.log('READY OR NOT');
      };
      reader.onerror = function () {
        console.log('Danger will robinson');
      };
      reader.readAsArrayBuffer(file);
      return dataSet;
    };

    return DataReaderLib;
  }
  if (typeof (DataReaderLib) === 'undefined') window.DataReaderLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
