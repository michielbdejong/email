remoteStorage.defineModule('messages', function(privateClient, publicClient) {
  var sock, open, sockStateCb = function() {}, resultCb = function() {};
  function getConfig() {
    return privateClient.getObject('.sockethub');
  }
  function getWebsocketAddress() {
    return getConfig().then(function(obj) {
      console.log('config is now', typeof(obj), obj, obj.domain, obj.port);
      if(obj) {
        return {
          wss: 'wss://'+obj.domain+':'+obj.port+'/sock/websocket',
          https: 'https://'+obj.domain+':'+obj.port+'/'
        };
      }
    });
  }
  return {
    exports: {
      getConfig: getConfig,
      getWebsocketAddress: getWebsocketAddress,
      setConfig: function (obj) {
        return privateClient.storeObject('sockethub-config', '.sockethub', obj);
      },
      tryConnect: function () {
        getWebsocketAddress().then(function(obj) {
          sock = new WebSocket(obj.wss);

          sock.onopen = function() {
            sockStateCb(true);
            open=true;
          };
          sock.onmessage = function(e) {
            var timestamp = new Date().getTime(),
              timePath = 'outgoing/'+timestamp.substring(0, 4)+'/'+timestamp.substring(4, 7)+'/'+timestamp.substring(7);
            privateClient.storeObject('activity', timePath, e).then(function() {
              onResult();
            });
          };
          sock.onclose = function() {
            if(open) {//open socket died
              newSocket();
            } else {//socket failed to open
              sockStateCb(false);
            }
          };
        });
      },
      getHistory: function() {
        return [];
      },
      sendTo: function(world, text) {
        return getConfig().then(function(config) {
          sock.send(JSON.stringify({
            world: world,
            id: new Date().getTime(),
            object: {
              text: text
            },
            secret: config.secret
          }));
        });
      },
      onSockState: function(cb) {
        sockStateCb = cb;
      },
      onResult: function(cb) {
        resultCb = cb;
      }
    }
  };
});
