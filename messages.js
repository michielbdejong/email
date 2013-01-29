remoteStorage.defineModule('messages', function(privateClient, publicClient) {
  var sock, open, sockStateCb = function() {}, resultCb = function() {};
  function getConfig() {
    return privateClient.getObject('.sockethub');
  }
  function getSockethubAddress() {
    return getConfig().then(function(obj) {
      //console.log('config is now', typeof(obj), obj, obj.domain, obj.port);
      if(obj) {
        return {
          ws: 'ws://'+obj.domain+':'+obj.port+'/',
          https: 'https://'+obj.domain+':'+obj.port+'/'
        };
      }
    });
  }
  function tryConnect() {
    getSockethubAddress().then(function(obj) {
      //console.log('setting sock to '+obj.ws);
      try {
        sock = new WebSocket(obj.ws, 'sockethub');
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
        var timeStr = new Date().getTime().toString(),
          timePath = 'outgoing/'+timeStr.substring(0, 4)+'/'+timeStr.substring(4);
        privateClient.storeObject('activity', timePath, e).then(function() {
          resultCb();
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
      getSockethubAddress: getSockethubAddress,
      tryConnect: tryConnect,
      setConfig: function (obj) {
        return privateClient.storeObject('sockethub-config', '.sockethub', obj);
      },
      getHistory: function() {
        var timeStr = new Date().getTime().toString(),
          timePath = 'outgoing/'+timeStr.substring(0, 4)+'/';
        return privateClient.getAll(timePath);
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
