# basic unhosted social example
this combines the 'social dashboard' example from https://unhosted.org/adventures/5/Facebook-and-Twitter-from-nodejs.html with remotestorage.

# known bugs
* app icon and favicon are missing
* css warnings from remoteStorage.js
* cb is not a function error
* should connect on enter
* getting unexplained could-not-connect
* does a PUT even if content is the same as existing
* it seems to connect to both 8282 and 8283
* status message should be more precise about the current step
