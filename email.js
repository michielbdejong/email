remoteStorage.defineModule('email', function(privateClient, publicClient) {
  privateClient.declareType('credentials', {
    description: 'Credentials that will allow sockethub to connect to your mailserver',
    type: 'object',
    properties: {
      host: {type: 'string', required: true},
      user: {type: 'string', required: true},
      password: {type: 'string', required: true}
    }
  });
  return {
    exports: {
      init: function() {
        publicClient.release('');
      },
      setCredentials: function(creds) {
        return privateClient.storeObject('credentials', 'credentials.json', creds);
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
});
