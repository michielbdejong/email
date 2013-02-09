remoteStorage.defineModule('sockethub', function(privateClient, publicClient) {
  var sock, host, secret,
    handler = {
      error: function(err) {
        console.log(err);
      },
      activity: function(activity) {
        console.log(activity);
      },
      ready: function() {
        console.log('ready');
      }
    };
  function sendActivity(data) {
    data.rid = new Date().getTime();
    if(sock && sock.readyState == WebSocket.OPEN) {
      console.log('[sockethub OUT]', JSON.stringify(data));
      sock.send(JSON.stringify(data));
      return data.rid;
    } else {
      handler.error('sockethub is not open, sorry');
    }
  }
  function connect(setHost, setSecret, setRemoteStorageCredentials) {
    host = setHost;
    sock = new WebSocket('ws://'+host+'/', 'sockethub');
    sock.onopen = function() {
      secret = setSecret;
      registerRid = sendActivity({
        platform: 'dispatcher',
        verb: 'register',
        object: {
          secret: secret,
          remoteStorage: setRemoteStorageCredentials
        }
      });
    };
    sock.onmessage = function(e) {
      var data;
      try {
        data = JSON.parse(e.data);
      } catch(err) {
        handler.error('bogus message: '+e.data);
        return;
      }
      console.log('[sockethub IN]', JSON.stringify(data));
      if(data.verb == 'confirm') {
        return;
      }
      if(data.rid && data.rid == registerRid && data.verb == 'register') {
        if(data.status) {
          handler.ready();
        } else {
          handler.error(data.message);
        }
      } else {
        handler.activity(data);
      }
    };
    sock.onclose = function() {
      if(secret) {
        sockethub.connect(host, secret);
      } else {
        handler.error('could not connect to the sockethub server on '+host);
      }
    }
  }
  function post(platform, credentials, object) {
    sendActivity({
      platform: platform,
      credentials: credentials,
      verb: 'post',
      object: object
    });
  }
  function send(platform, credentials, activity) {
    sendActivity({
      platform: platform,
      credentials: credentials,
      verb: 'send',
      actor: activity.actor,
      object: activity.object,
      target: activity.target
    });
  }
  return {
    exports: {
      connect: connect,
      post: post,
      send: send,
      getState: function() {
        return sock.readyState;
      },
      reset: function() {
        sock.close();
      },
      on: function(event, cb) {
        handler[event] = cb;
      },
      setCredentials: function(creds) {
        return privateClient.storeDocument('credentials', 'credentials.json', creds);
      },
      onCredentials: function(cb) {
        privateClient.on('change', function(e) {
          if(e.origin != 'window' && e.path == 'credentials.json') {
            var obj;
            try {
              obj = JSON.parse(e.newValue);
            } catch(e) {
            }
            if(obj) {
              cb(obj);
            }
          }
        });
      }
    }
  };
})();
