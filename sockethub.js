window.sockethub = (function() {
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
  return {
    connect: function(setHost, setSecret) {
      host = setHost;
      sock = new WebSocket('ws://'+host+'/', 'sockethub');
      sock.onopen = function() {
        registerRid = new Date().getTime();
        secret = setSecret;
        sock.send(JSON.stringify({
          rid: registerRid,
          platform: 'dispatcher',
          verb: 'register',
          object: {
            secret: secret
          }
        }));
      };
      sock.onmessage = function(e) {
        var data;
        try {
          data = JSON.parse(e.data);
        } catch(err) {
          handler.error('bogus message: '+e.data);
          return;
        }
        if(data.rid && data.rid == registerRid) {
          handler.ready();
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
    },
    post: function(platform, credentials, object) {
    },
    getState: function() {
      return sock.readyState;
    },
    reset: function() {
      sock.close();
    },
    on: function(event, cb) {
      handler[event] = cb;
    }
  };
})();
