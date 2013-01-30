document.sockethub = (function() {
  var sock, host, secret
    onError: function(err) {
      console.log(err);
    },
    onActivity: function(activity) {
      console.log(activity);
    },
    onReady: function() {
      console.log('ready');
    };
  return {
    connect: function(setHost, setSecret) {
      host = setHost;
      secret = setSecret;
      sock = new WebSocket('ws://'+host+'/', 'sockethub');
      sock.onopen = function() {
        registerRid = new Date().getTime();
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
          onError('bogus message: '+e.data);
          return;
        }
        if(data.rid && data.rid == registerRid) {
          onReady();
        } else {
          onActivity(data);
        }
      };
      sock.onclose = function() {
        this.connect(host, secret);
      }
    },
    post: function(platform, credentials, object) {
    },
    getState: function() {
      return sock.readyState;
    },
    reset: function() {
      sock.close();
    }
  };
})();
