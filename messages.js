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
  function tryConnect() {
    getWebsocketAddress().then(function(obj) {
      console.log('setting sock to '+obj.wss);
      try {
        sock = new WebSocket(obj.wss);
      } catch(e) {
        console.log(e);
        sockStateCb(false);
        return;
      }
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
        console.log('onclose', open);
        if(open) {//open socket died
          tryConnect();
        } else {//socket failed to open
          sockStateCb(false);
        }
      };
    });
  }
  return {
    exports: {
      getConfig: getConfig,
      getWebsocketAddress: getWebsocketAddress,
      tryConnect: tryConnect,
      setConfig: function (obj) {
        return privateClient.storeObject('sockethub-config', '.sockethub', obj);
      },
      getHistory: function() {
        return privateClient.getAll('').then(function() {
          return [];
        });
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
