remoteStorage.defineModule('email', function(privateClient, publicClient) {
  return {
    exports: {
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
});
