'use strict';

var assert  = require('assert');
var _       = require('lodash');
var Promise = require('bluebird');
var utils   = require('./utils');

module.exports = function (client) {
  function Company (data) {
    _.extend(this, data);
  }

  Company.find = Promise.method(function (options) {
    assert(options && options.domain, 'A domain must be provided');
    return this.client.request(_.extend({
      api: 'company',
      path: '/companies/domain/' + options.domain
    }, options))
    .bind(this)
    .then(utils.cast)
    .catch(utils.isQueued, function () {
      throw new this.QueuedError('Company lookup queued');
    })
    .catch(utils.isUnknownRecord, function () {
      throw new this.NotFoundError('Company not found');
    });
  });

  Company.prototype.client = Company.client = client;
  Company.NotFoundError = utils.NotFoundError;
  Company.QueuedError = utils.QueuedError;

  return Company;
};
