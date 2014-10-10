'use strict';

var expect   = require('chai').expect;
var nock     = require('nock');
var sinon    = require('sinon');
var needle   = require('needle');
var clearbit = require('../');
var Client   = clearbit.Client;
var pkg      = require('../package.json');

describe('Client', function () {

  var client;
  beforeEach(function () {
    client = clearbit('k');
  });

  describe('Constructor', function () {

    it('must be called with new', function () {
      expect(Client).to.throw(/called with new/);
    });

    it('must provide an API key', function () {
      expect(function () {
        return new Client();
      })
      .to.throw(/API key/);
    });

    it('configures the API key', function () {
      expect(new Client({key: 'k'})).to.have.property('key', 'k');
    });

  });

  describe('#base', function () {

    it('requires an API', function () {
      expect(client.base.bind(client, {}))
        .to.throw(/API must be specified/);
    });

    it('can generate the default base', function () {
      expect(client.base({
        api: 'person'
      }))
      .to.equal('https://person.clearbit.co/v1');
    });

    it('can generate a streaming base', function () {
      expect(client.base({
        api: 'person',
        stream: true
      }))
      .to.equal('https://person-stream.clearbit.co/v1');
    });

    it('can set a custom version', function () {
      expect(client.base({
        api: 'person',
        version: '2'
      }))
      .to.equal('https://person.clearbit.co/v2');
    });

  });

  describe('#request', function () {

    var mock;
    before(function () {
      mock = nock('https://person.clearbit.co');
    });
    after(nock.cleanAll);
    afterEach(function () {
      mock.done();
    });

    it('sends a get request to the specified endpoint', function () {
      mock
        .get('/v1/people/email/bvdrucker@gmail.com')
        .reply(202);
      return client.request({
        api: 'person',
        path: '/people/email/bvdrucker@gmail.com'
      });
    });

    it('can generate a qs', function () {
      mock
        .get('/v1/people/email/bvdrucker@gmail.com?webhook_id=123')
        .reply(202);
      return client.request({
        api: 'person',
        path: '/people/email/bvdrucker@gmail.com',
        query: {
          webhook_id: '123'
        }
      });
    });

    it('uses a timeout of 60 seconds for streaming requests', function () {
      sinon.stub(needle, 'request').yieldsAsync(null, {}, undefined);
      return client.request({
        api: 'person',
        stream: true
      })
      .then(function () {
        expect(needle.request.firstCall.args[3])
          .to.have.property('timeout', 60000);
      })
      .finally(function () {
        needle.request.restore();
      });
    });

    it('sends a basic auth header', function () {
      mock
        .get('/v1/people/email/bvdrucker@gmail.com')
        .matchHeader('Authorization', 'Basic aw==')
        .reply(202);
      return client.request({
        api: 'person',
        path: '/people/email/bvdrucker@gmail.com'
      });
    });

    it('sends a user agent', function () {
      mock
        .get('/v1/people/email/bvdrucker@gmail.com')
        .matchHeader('User-Agent', 'ClearbitNode/v' + pkg.version)
        .reply(202);
      return client.request({
        api: 'person',
        path: '/people/email/bvdrucker@gmail.com'
      });
    });

  });

});
