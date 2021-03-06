/*global suite,test,setup,suiteSetup,suiteTeardown*/

/**
 * Dependencies
 */

var Server = require('./lib/server');
var request = require('superagent');
var assert = require('assert');
var parse = require('..');

/**
 * Port to run the local test server on.
 *
 * @type {Number}
 */
const PORT = 4000;

/**
 * Tests
 */

suite('magnet-parser', function() {
  suiteSetup(function() {
    this.server = new Server(`${__dirname}/apps`, PORT);
    return this.server.start();
  });

  suiteTeardown(function() {
    this.server.stop();
  });

  suite('simple', function() {
    setup(function() {
      return fetch('simple/index.html')
        .then(result => parse(result.html, result.url))
        .then(result => {
          this.result = result;
        });
    });

    test('it returns the title', function() {
      assert.equal(this.result.title, 'title');
    });

    test('it returns the description', function() {
      assert.equal(this.result.description, 'description');
    });

    test('it returns a list of keywords', function() {
      assert.deepEqual(this.result.keywords, [
        'magnet',
        'best',
        'physical web',
        'client'
      ]);
    });
  });

  suite('icon', function() {
    suite('bbc', function() {
      setup(function() {
        return fetch('icon/index.html')
          .then(result => parse(result.html, result.url))
          .then(result => {
            this.result = result;
          });
      });

      test('it returns the icon', function() {
        assert.equal(this.result.icon, 'http://static.bbci.co.uk/news/1.111.16/apple-touch-icon.png');
      });

      test('it returns a list of all found icons', function() {
        assert.equal(this.result.icons.length, 5);
      });
    });

    suite('github-repo', function() {
      setup(function() {
        return fetch('icon/github-repo.html')
          .then(result => parse(result.html, result.url))
          .then(result => {
            this.result = result;
          });
      });

      test('it returns the icon', function() {
        assert.equal(this.result.icon, 'http://localhost:4000/apple-touch-icon-180x180.png');
      });
    });
  });

  suite('open-graph', function() {
    setup(function() {
      return fetch('icon/index.html')
        .then(result => parse(result.html, result.url))
        .then(result => {
          this.result = result;
        });
    });

    test('it returns og data', function() {
      var og_data = this.result.og_data;

      assert.equal(og_data.title, 'EU referendum: David Cameron in Brussels for crucial EU talks - BBC News');
      assert.equal(og_data.description, 'David Cameron is in Brussels for key talks on his EU reform package with EU chiefs and senior MEPs, as he seeks to drum up support ahead of Thursday\'s summit.');
      assert.equal(og_data.image, 'http://ichef.bbci.co.uk/news/1024/cpsprodpb/7345/production/_88290592_031490526-1.jpg');
    });
  });

  suite('manifest', function() {
    setup(function() {
      return fetch('manifest/index.html')
        .then(result => parse(result.html, result.url))
        .then(result => {
          this.result = result;
        });
    });

    test('title is returned (trumps <title>)', function() {
      assert.equal(this.result.title, 'Google I/O 2015');
    });

    test('icon returned (trumps <meta>)', function() {
      assert.equal(this.result.icon, `http://localhost:${PORT}/manifest/images/touch/homescreen192.png`);
    });

    test('short_name returned', function() {
      assert.equal(this.result.short_name, 'I/O 2015');
    });

    test('it copes with query params on target url', function() {
      assert.equal(this.result.title, 'Google I/O 2015');
    });

    test('it copes wth absolute paths', function() {
      assert.equal(this.result.title, 'Google I/O 2015');
    });
  });

  suite('oembed', function() {
    suite('json', function() {
      setup(function() {
        return fetch('oembed/json/index.html')
          .then(result => parse(result.html, result.url))
          .then(result => {
            this.result = result;
          });
      });

      test('it parses the contents', function() {
        assert.ok(this.result.embed);
        assert.ok(this.result.embed.html);
      });
    });

    suite('xml', function() {
      setup(function() {
        return fetch('oembed/xml/index.html')
          .then(result => parse(result.html, result.url))
          .then(result => {
            this.result = result;
          });
      });

      test('it parses the contents', function() {
        assert.ok(this.result.embed);
        assert.ok(this.result.embed.html);
      });
    });

    test('copes with query params on target url', function() {
      return fetch('oembed/json/index.html?url=http://google.com')
        .then(result => parse(result.html, result.url))
        .then(result => {
          assert.ok(result.embed);
          assert.ok(result.embed.html);
        });
    });
  });

  suite('theme color', function() {
    test('it returns <meta> defined', function() {
      return fetch('simple/index.html')
        .then(result => parse(result.html, result.url))
        .then(result => {
          assert.equal(result.theme_color, '#db5945');
        });
    });

    test('it returns manifest defined', function() {
      return fetch('manifest/index.html')
        .then(result => parse(result.html, result.url))
        .then(result => {
          assert.equal(result.theme_color, '#2196F3');
        });
    });
  });

  /**
   * Utils
   */

  function fetch(app) {
    return new Promise((resolve, reject) => {
      request
        .get(`http://localhost:${PORT}/${app}`)
        .end((err, result) => {
          if (err) reject(err);
          resolve({
            html: result.text,
            url: result.res.url || result.request.url
          });
        });
    });
  }
});
