# ReleaseDates.io Backend Server

This server is made with Node JS and Express for the ReleaseDates.io Angular web application to wrap TheTVDB and DailyMotion APIs.

## Installation, Configuration, and Running

1. Clone the repo
2. Run `npm install`
3. Clone the `config.sample.js` to `config.js` (copy, paste, rename).
3. Set the `firebaseAdminCertificate` in `config.js` to your Firebase Admin SDK Certificate obtained from your Firebase project's settings
4. Obtain an API key from TheTVDB by registering and generating a key in your account, then set the `thetvdb.key` in `config.js` with the API key
5. Review the `config.js` comments and configure your server (`thetvdb.tokenRefreshTime`, `firebaseAuthenticationRequired`, etc.)
6. Run `node index` to start the server locally on port 3000

## Authentication

The server uses Firebase token verification to authenticate requests. The token is automatically obtained by the web application and provided using the `token` query parameter on all requests (non-logged in users are automatically logged in as anonymous users and therefore have a valid ID token).

This behavior can be turned off by setting `firebaseAuthenticationRequired` property to `false` in `config.js`.

## Routes & Query Params

**Note:** The response types refer to the Backend models in the Angular app.

| Route | Query Params | Description | Response |
|:-----:|:------------:|:------------|:---------|
| /test | token | A simple route to test if the server is running and the authentication is working. | {everythingWorking: true} or [Error](#error) |
| /search | token, q | Searches for the given query in TheTVDB and returns the results with posters and thumbnails. | [SearchResult](#searchresult)[] or [Error](#error) |
| /series | token, id | Hits multiple API routes of TheTVDB and returns all the data needed by the Angular app for the given series ID. | [Series](#series) or [Error](#error) |
| /videos | token, q | Searches the DailyMotion API for the given query and returns results with thumbnails and URLs. | [VideosResult](#videosresult)[] or [Error](#error) |

## Response Types

### SearchResult

```json
{
  "id": 0,
  "name": "",
  "posters": [{
    "poster": "",
    "thumbnail": ""
  }]
}
```

### Series

```json
{
  "id": 0,
  "name": "",
  "status": "",
  "overview": "",
  "network": "",
  "rating": 0,
  "imdbLink": "",
  "airDate": "",
  "runtime": "",
  "genre": [""],
  "posters": [{
    "poster": "",
    "thumbnail": ""
  }],
  "totalSeasons": 0,
  "totalEpisodes": 0,
  "seasons": [{
    "number": 0,
    "episodes": [{
        "number": 0,
        "name": "",
        "overview": "",
        "airDate": ""
    }]
  }]
}
```

### VideosResult

```json
{
  "title": "",
  "duration": "",
  "url": "",
  "thumbnail": ""
}
```

### Error

```json
{
  "error": true,
  "message": ""
}
```
