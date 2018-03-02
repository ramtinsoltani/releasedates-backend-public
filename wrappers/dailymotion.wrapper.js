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

          item.duration = wrapper._formatTime(item.duration);

          return item;

        }));

      });

    });

  },

  _formatTime: (duration) => {

    let seconds, minutes, hours, time = [];

    seconds = duration;
    minutes = Math.floor(seconds / 60);
    seconds %= 60;
    hours = Math.floor(minutes / 60);
    minutes %= 60;

    if ( hours < 10 ) hours = '0' + hours;
    if ( minutes < 10 ) minutes = '0' + minutes;
    if ( seconds < 10 ) seconds = '0' + seconds;

    if ( +hours ) time.push(hours);
    time.push(minutes);
    time.push(seconds);

    return time.join(':');

  }

};

module.exports = wrapper;
