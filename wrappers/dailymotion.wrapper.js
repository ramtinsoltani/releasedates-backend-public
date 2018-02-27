const request = require('request');

let wrapper = {

  search: (definition, query) => {

    return new Promise((resolve, reject) => {

      request.get({
        url: `${definition.url}/videos?fields=title,duration,tiny_url,thumbnail_url&search=${query}&limit=20`,
        json: true
      }, (error, response, body) => {

        if ( error ) {

          reject();
          return;

        }

        if ( ! body.list.length ) {

          resolve({
            error: true,
            message: `No results found for '${query}'!`
          });

          return;

        }

        resolve(body.list.map((item) => {

          item.url = item.tiny_url;
          delete item.tiny_url;

          item.thumbnail = item.thumbnail_url;
          delete item.thumbnail_url;

          const minutes = Math.floor(item.duration / 60);
          const seconds = item.duration % 60;

          item.duration = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;

          return item;

        }));

      });

    });

  }

};

module.exports = wrapper;
