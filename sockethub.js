remoteStorage.defineModule('sockethub', function(privateClient, publicClient) {
  privateClient.declareType('credentials', {
    description: 'Credentials that will allow this module to connect to your sockethub server',
    type: 'object',
    properties: {
      host: {type: 'string', required: true},
      secret: {type: 'string', required: true}
    }
  });
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
        connectNow();
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
  function retrieve(platform, credentials) {
    credentials.tls = true;
    sendActivity({
      platform: platform,
      credentials: credentials,
      verb: 'retrieve'
    });
  }
  function connectNow() {
    privateClient.getObject('credentials.json').then(function(creds) {
      connect(creds.host, creds.secret, {
        storageInfo: {
          href: remoteStorage.getStorageHref(),
          type: remoteStorage.getStorageType()
        },
        scope: remoteStorage.claimedModules,
        bearerToken: remoteStorage.getBearerToken()
      });
    });
  }
  return {
    exports: {
      init: function() {
        publicClient.release('');
      },
      connectNow: connectNow,
      post: post,
      send: send,
      retrieve: retrieve,
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
        return privateClient.storeObject('credentials', 'credentials.json', creds);
      },
      setPlatformCredentials: function(platform, creds) {
        return privateClient.storeObject('credentials', 'credentials/'+platform, creds);
      },
      //used on page load, not sure if there is a better way to do this:
      getCredentials: function(creds) {
        return privateClient.getObject('credentials');
      },
      onCredentials: function(cb) {
        privateClient.on('change', function(e) {
          connectNow();
          console.log('sockethub private change');
          console.log(e);
          if(e.origin != 'window' && e.relativePath == 'credentials.json') {
            console.log('found '+e.newValue);
            cb(e.newValue);
          }
        });
      }
    }
  };
});
