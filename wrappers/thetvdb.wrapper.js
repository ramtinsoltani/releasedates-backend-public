const request = require('request');

let wrapper = {

  authenticate: (definition) => {

    return new Promise((resolve, reject) => {

      request.post({
        url: `${definition.url}/login`,
        body: {
          apikey: definition.key
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          reject();

        }
        else {

          resolve(body.token);

        }

      });

    });

  },

  search: (definition, query) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/search/series?name=${query}`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          reject();

        }
        else {

          const res = [];
          const promises = [];

          for ( const series of body.data ) {

            res.push({
              id: series.id,
              name: series.seriesName
            });

            promises.push(wrapper._getPostersById(definition, series.id));

          }

          Promise.all(promises)
          .then((posters) => {

            let index = 0;

            for ( const poster of posters ) {

              res[index].posters = poster;
              index++;

            }

            resolve(res);

          });

        }

      });

    });

  },

  series: (definition, id) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          reject();

        }
        else {

          let res = {};

          wrapper._getPostersById(definition, id)
          .then((posters) => {

            res = {
              id: body.data.id,
              name: body.data.seriesName,
              status: body.data.status,
              overview: body.data.overview,
              network: body.data.network,
              rating: body.data.siteRating,
              imdbLink: body.data.imdbId ? `https://imdb.com/title/${body.data.imdbId}` : null,
              airDate: body.data.airsDayOfWeek && body.data.airsTime ? `${body.data.airsDayOfWeek}s at ${body.data.airsTime}` : null,
              runtime: body.data.runtime,
              genre: body.data.genre,
              posters: posters,
              lastUpdated: body.data.lastUpdated
            };

            return wrapper._getTotalsById(definition, id);

          })
          .then((totals) => {

            res.totalSeasons = totals.totalSeasons;
            res.totalEpisodes = totals.totalEpisodes;

            const promises = [];

            for ( let index = +totals.firstSeason; index <= totals.totalSeasons; index++ ) {

              promises.push(wrapper._getEpisodesBySeason(definition, index, id));

            }

            Promise.all(promises)
            .then((seasons) => {

              res.seasons = [];

              for ( const season of seasons ) {

                res.seasons.push(season);

              }

              resolve(res);

            });

          })
          .catch(() => {

            resolve(res);

          });

        }

      });

    });

  },

  updates: (definition, id, since) => {

    return new Promise((resolve, reject) => {

      let lastUpdated;

      const req = request.get({
        url: `${definition.url}/series/${id}/filter?keys=lastUpdated`,
        auth: {
          bearer: definition.token
        },
        json: true
      })
      .on('response', (response) => {

        lastUpdated = (new Date(response.headers['last-modified'])).getTime() / 1000;

      })
      .on('data', (body) => {

        if ( body.Error ) {

          reject();

        }
        else {

          if ( lastUpdated <= since ) {

            resolve({
              hasUpdates: false
            });

            return;

          }

          wrapper._getTotalsById(definition, id)
          .then((totals) => {

            return wrapper._getEpisodesBySeason(definition, totals.totalSeasons, id);

          })
          .then((season) => {

            resolve({
              hasUpdates: true,
              lastUpdated: lastUpdated,
              episodes: season.episodes.map((episode) => { return { number: episode.number, hasName: !! episode.name, airDate: episode.airDate }; })
            });

          })
          .catch(() => {

            reject();

          });

        }

      })
      .on('error', () => {

        reject();

      });

    });

  },

  discover: (definition, count) => {

    return new Promise((resolve, reject) => {

      const rightnow = new Date();
      const lastWeek = new Date(rightnow.getFullYear(), rightnow.getMonth(), rightnow.getDate() - 7);
      const since = lastWeek.getTime() / 1000;

      request.get({
        url: `${definition.url}/updated/query?fromTime=${since}`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          reject();

        }
        else {

          const picked = wrapper._pickRandom(body.data, count);
          const promises = [];

          for ( const series of picked ) {

            promises.push(wrapper._getDiscoverData(definition, series.id));

          }

          Promise.all(promises)
          .then((data) => {

            resolve(data);

          })
          .catch(() => {

            reject();

          });

        }

      });

    });

  },

  _pickRandom: (array, count) => {

    const picked = [];

    for ( let index = 0; index < count; index++ ) {

      if ( ! array.length ) break;

      picked.push(array.splice(Math.floor(Math.random() * array.length), 1)[0]);

    }

    return picked;

  },

  _getDiscoverData: (definition, id) => {

    return new Promise((resolve, reject) => {

      const res = {};

      wrapper._getSeriesName(definition, id)
      .then((name) => {

        res.id = id;
        res.name = name;

        return wrapper._getPostersById(definition, id);

      })
      .then((posters) => {

        res.posters = posters;

        resolve(res);

      })
      .catch(() => {

        reject();

      });

    });

  },

  _getSeriesName: (definition, id) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}/filter?keys=seriesName`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          resolve(null);

        }
        else {

          resolve(body.data.seriesName);

        }

      });

    });

  },

  _getEpisodesBySeason: (definition, seasonNumber, id) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}/episodes/query?airedSeason=${seasonNumber}`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          resolve(null);

        }
        else {

          const promises = [];

          for ( let index = 1; index <= body.links.last; index++ ) {

            promises.push(wrapper._getEpisodesBySeasonWithPage(definition, seasonNumber, id, index));

          }

          Promise.all(promises)
          .then((episodesArray) => {

            let res = [];

            for ( const episodes of episodesArray ) {

              res = res.concat(episodes);

            }

            resolve({
              number: seasonNumber,
              episodes: res
            });

          });

        }

      });

    });

  },

  _getEpisodesBySeasonWithPage: (definition, seasonNumber, id, pageNumber) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}/episodes/query?airedSeason=${seasonNumber}&page=${pageNumber}`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          resolve(null);

        }
        else {

          const res = [];

          for ( const episode of body.data ) {

            res.push({
              number: episode.airedEpisodeNumber,
              name: episode.episodeName,
              overview: episode.overview,
              airDate: episode.firstAired
            });

          }

          resolve(res);

        }

      });

    });

  },

  _getTotalsById: (definition, id) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}/episodes/summary`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          resolve(null);

        }
        else {

          resolve({
            totalSeasons: Math.max(...body.data.airedSeasons),
            totalEpisodes: +body.data.airedEpisodes,
            firstSeason: Math.min(...body.data.airedSeasons)
          });

        }

      });

    });

  },

  _getPostersById: (definition, id) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/series/${id}/images/query?keyType=poster`,
        auth: {
          bearer: definition.token
        },
        json: true
      }, (error, response, body) => {

        if ( error || body.Error ) {

          resolve([{
            poster: null,
            thumbnail: null
          }]);

        }
        else {

          const res = [];

          for ( const poster of body.data ) {

            res.push({
              poster: definition.imageUrl + poster.fileName,
              thumbnail: definition.imageUrl + poster.thumbnail
            });

          }

          resolve(res);

        }

      });

    });

  }

};

module.exports = wrapper;
