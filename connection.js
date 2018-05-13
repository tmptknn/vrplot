/* eslint-disable require-jsdoc*/
(function libraryWrapper(window) {
  function defineLibrary() {
    const ConnectionLib = {};
    let socket;

    ConnectionLib.makeConnection = function makeConnection(handlejson){
      const jsonfun = handlejson;
      const ho = location.host.split(":")[0];

      socket = new WebSocket("ws://"+(ho?ho:"localhost")+":3773");

      socket.onopen = function() {
         console.log("connection open");
      };

      socket.onmessage = function (message) {

         let json;
         // console.log(""+message.data);
         try {
         json = JSON.parse(message.data);
         } catch (e) {
           console.log('This doesn\'t look like a valid JSON: ',
               message.data);
           return;
         }
         if(json){
           jsonfun(json);
         }
      };

      socket.onclose = function() {

         // websocket is closed.
         console.log("Connection is closed...");
      };
    }

    ConnectionLib.sendJson = function sendJson(json){
      socket.send(JSON.stringify(json));
    }

    return ConnectionLib;
  }
  if (typeof (ConnectionLib) === 'undefined') window.ConnectionLib = defineLibrary(); // eslint-disable-line no-param-reassign, no-undef
  else console.log('Library already defined.'); // eslint-disable-line no-console
}(window)); // eslint-disable-line no-undef
