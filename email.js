remoteStorage.defineModule('email', function(privateClient, publicClient) {
  privateClient.declareType('smtp-credentials', {//work around bug where two modules may not use the same type name
    description: 'Credentials that will allow sockethub to connect to your outgoing mailserver',
    type: 'object',
    properties: {
      host: {type: 'string', required: true},
      user: {type: 'string', required: true},
      password: {type: 'string', required: true}
    }
  });
  privateClient.declareType('pop3-credentials', {//work around bug where two modules may not use the same type name
    description: 'Credentials that will allow sockethub to connect to your incoming mailserver',
    type: 'object',
    properties: {
      host: {type: 'string', required: true},
      port: {type: 'string', required: true},
      user: {type: 'string', required: true},
      password: {type: 'string', required: true}
    }
  });
  return {
    exports: {
      init: function() {
        publicClient.release('');
      },
      setSmtpCredentials: function(creds) {
        return privateClient.storeObject('smtp-credentials', 'credentials/smtp.json', creds);
      },
      getSmtpCredentials: function() {
        return privateClient.getObject('credentials/smtp.json');
      },
      onSmtpCredentials: function(cb) {
        privateClient.on('change', function(e) {
          console.log('email private change');
          console.log(e);
          if(e.origin != 'window' && e.relativePath == 'credentials/smtp.json') {
            console.log('found '+e.newValue);
            cb(e.newValue);
          }
        });
      }
      setPop3Credentials: function(creds) {
        return privateClient.storeObject('smtp-credentials', 'credentials/pop3.json', creds);
      },
      getPop3Credentials: function() {
        return privateClient.getObject('credentials/pop3.json');
      },
      onPop3Credentials: function(cb) {
        privateClient.on('change', function(e) {
          console.log('email private change');
          console.log(e);
          if(e.origin != 'window' && e.relativePath == 'credentials/pop3.json') {
            console.log('found '+e.newValue);
            cb(e.newValue);
          }
        });
      }
    }
  };
});
