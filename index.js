const express = require('express');
const app = express();
const admin = require('firebase-admin');
const config = require(`${__dirname}/config.js`);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(config.firebaseAdminCertificate),
  databaseURL: 'https://releasedatesio.firebaseio.com'
});

// Enable CORS for authorized domains
app.use((req, res, next) => {

  if ( config.authorizedDomains.includes(req.headers.origin) ) {

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

  }

  next();

});

// Signature check
app.use((req, res, next) => {

  if ( (! req.query.token || ! req.query.token.trim()) && config.firebaseAuthenticationRequired ) {

    // Reject (Missing parameter)
    res
    .status(405)
    .json({
      error: true,
      message: "The token parameter must be present and valid on all routes!"
    });

    return;

  }

  if ( req.path === '/search' ) {

    if ( ! req.query.q || ! req.query.q.trim() ) {

      // Reject (Missing parameters)
      res
      .status(405)
      .json({
        error: true,
        message: "The 'q' parameter must be present and valid for this route!"
      });

      return;

    }

    next();

  }
  else if ( req.path === '/series' ) {

    if ( ! req.query.id || ! req.query.id.trim() ) {

      // Reject (Missing parameters)
      res
      .status(405)
      .json({
        error: true,
        message: "The 'id' parameter must be present and valid for this route!"
      });

      return;

    }

    next();

  }
  else if ( req.path === '/videos' ) {

    if ( ! req.query.q || ! req.query.q.trim() ) {

      // Reject (Missing parameters)
      res
      .status(405)
      .json({
        error: true,
        message: "The 'q' parameter must be present and valid for this route!"
      });

      return;

    }

    next();

  }
  else if ( req.path === '/test' ) {

    next();

  }
  else {

    // Reject (404)
    res
    .status(404)
    .json({
      error: true,
      message: 'The requested route does not exist!'
    });

    return;

  }

});

// Firebase Authentication
app.use((req, res, next) => {

  if ( ! config.firebaseAuthenticationRequired ) {

    next();
    return;

  }

  admin.auth().verifyIdToken(req.query.token.trim())
  .then(() => {

    next();

  })
  .catch(() => {

    res
    .status(403)
    .json({
      error: true,
      message: "Authentication failed! The token is either invalid or expired."
    });

  });

});

// Refresh/retreive TheTVDB token if needed
app.use((req, res, next) => {

  if (
    ( req.path === '/search' || req.path === '/series' ) &&
    ( ! config.thetvdb.token || (Date.now() - config.thetvdb.lastTokenRefreshTimestamp) > config.thetvdb.tokenRefreshTime )
  ) {

    config.thetvdb.wrapper.authenticate(config.thetvdb)
    .then((token) => {

      config.thetvdb.token = token;
      config.thetvdb.lastTokenRefreshTimestamp = Date.now();
      console.log('TOKEN REFRESHED');

      next();

    })
    .catch(() => {

      res
      .status(520)
      .json({
        error: true,
        message: 'An unknown error has occurred!'
      });

    });

  }
  else {

    next();

  }

});

app.get('/test', (req, res) => {

  res.json({
    everythingWorking: true
  });

});

app.get('/series', (req, res) => {

  config.thetvdb.wrapper.series(config.thetvdb, req.query.id.trim())
  .then((response) => {

    res.json(response);

  })
  .catch(() => {

    res
    .status(520)
    .json({
      error: true,
      message: 'An unknown error has occurred!'
    });

  });

});

app.get('/search', (req, res) => {

  config.thetvdb.wrapper.search(config.thetvdb, req.query.q.trim())
  .then((response) => {

    res.json(response);

  })
  .catch(() => {

    res
    .status(520)
    .json({
      error: true,
      message: 'An unknown error has occurred!'
    });

  });

});

app.get('/videos', (req, res) => {

  config.dailymotion.wrapper.search(config.dailymotion, req.query.q.trim().replace(' ', '+'))
  .then((response) => {

    res.json(response);

  })
  .catch(() => {

    res
    .status(520)
    .json({
      error: true,
      message: 'An unknown error has occurred!'
    });

  });

});

app.listen(3000, () => console.log('Server running on port 3000'));
