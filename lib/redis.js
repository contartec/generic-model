'use strict'

const bluebird = require('bluebird')
const node_redis = require('redis')
const redisJSON = require('redis-rejson')

redisJSON(node_redis)

bluebird.promisifyAll(node_redis.RedisClient.prototype)
bluebird.promisifyAll(node_redis.Multi.prototype)

const redis = node_redis.createClient(process.env.REDISCLOUD_URL)

redis
  .on('connect', () => {
    console
      .warn(`[redis] connect ${redis.connected}`, {
        info: redis.server_info
      })
  })
  .on('error', e => {
    console
      .error(`[redis] connect ${redis.connected}`, {
        error: e.message,
        stack: e.stack
      })
  })

module.exports = redis