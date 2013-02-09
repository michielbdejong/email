remoteStorage.defineModule('email', function(privateClient, publicClient) {
  privateClient.declareType('credentials2', {//work around bug where two modules may not use the same type name
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
        return privateClient.storeObject('credentials2', 'credentials.json', creds);
      },
      onCredentials: function(cb) {
        privateClient.on('change', function(e) {
          console.log('email private change');
          console.log(e);
          //if(e.origin != 'window' && e.path == 'credentials.json') {
          if(e.origin != 'window' && e.path == '/email/credentials.json') {
            console.log('found '+e.newValue);
            cb(e.newValue);
          }
        });
      }
    }
  };
});
