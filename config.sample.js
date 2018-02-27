module.exports = {
  thetvdb: {
    url: 'https://api.thetvdb.com',
    // Your TheTVDB API Key (generate one in your account page after registering on https://thetvdb.com)
    key: '',
    // Shouldn't be more than 24 hours
    tokenRefreshTime: 4.32e+7, // 12 Hours
    imageUrl: 'https://www.thetvdb.com/banners/',
    wrapper: require(`${__dirname}/wrappers/thetvdb.wrapper.js`)
  },
  dailymotion: {
    url: 'https://api.dailymotion.com',
    videoUrl: 'https://www.dailymotion.com/video/',
    wrapper: require(`${__dirname}/wrappers/dailymotion.wrapper.js`)
  },
  // List of authorized domains to enable CORS (add * as one domain to enable for all domains)
  authorizedDomains: [
    'http://localhost:4200'
  ],
  // Your Firebase Admin SDK certificate obtained from Firebase console
  firebaseAdminCertificate: {},
  // Whether authentication by Firebaseis required for all paths (the token query parameter must exist on all requests if 'true')
  firebaseAuthenticationRequired: true
}
