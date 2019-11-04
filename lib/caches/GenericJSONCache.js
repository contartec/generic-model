'use strict'

const redis = require('../redis')

const JSON_GET_SUBCOMMANDS = [
  'NOESCAPE'
]

const UPDATE_PARAMS = {
  shallow: true
}

/**
 * Contains a set of simple methods to handle the `redis` `ReJSON` type
 * 
 * @class GenericJSONCache
*/
class GenericJSONCache {
  static get JSON_GET_SUBCOMMANDS() { return JSON_GET_SUBCOMMANDS }
  static get UPDATE_PARAMS()        { return UPDATE_PARAMS }

  static get jsonGetSubcommands()   { return JSON_GET_SUBCOMMANDS.join(' ') }

  /**
   * Returns the parsed cache value
   * 
   * @param {string} cacheString The `cache` string
   * 
   * @return {(Object|string)} The parsed cache `value`
  */
  static parseCacheString(cacheString) {
    let cacheValue = null

    if (cacheString) {
      if (typeof(cacheString) == 'string') {
        cacheValue = cacheString.match(/^".*"$/g) ?
          cacheString.substring(1, cacheString.length - 1) :
          JSON.parse(cacheString)
      }
      else
        cacheValue = cacheString
    }

    return cacheValue
  }

  /**
   * Returns whether the `keyName` is cached or not
   * @async
   * 
   * @param {string} keyName The `keyName`
   * @param {*} [args] The others attrs to fetch the `keyName` through (and if it exists) `.getKeyName`
   * 
   * @return {Boolean} Whether the `keyName` is cached or not
  */
  static async isCached(keyName, ...args) {
    let keyNameTemp = keyName

    if (args.length > 0 && typeof(this.getKeyName) == 'function') {
      keyNameTemp = this
        .getKeyName(keyName, args)
    }

    const count = await redis
      .json_objlenAsync(keyNameTemp)

    return count >= 1
  }

  /**
    * Returns the `key` names in cache
    *
    * @param {string} searchKey The search string to fetch the key names
    * @param {redis.Multi} [commands] The `redis` multi command object to chain(See {@link https://github.com/NodeRedis/node_redis#clientmulticommands})
    *
    * @return {Promise<Array<string>>} The `key` names in cache
  */
  static _getKeyNamesCache(searchKey, commands = redis) {
    return commands
      .keysAsync(searchKey)
  }

  /**
   * Returns the `objects` cache object
   * @async
   * 
   * @param {string} keyName The `key` name
   * @param {Object} [attrs = []] The list of specified `attrs` to return (`default:  all`)
   * @param {redis.Multi} [commands] The `redis` multi command object to chain(See {@link https://github.com/NodeRedis/node_redis#clientmulticommands})
   * 
   * @return {Promise<string>} The `object` cache
  */
  static _getCache(keyName, attrs = ['.'], commands = redis) {
    const params = [
      keyName,
      this.jsonGetSubcommands,
      ...attrs
    ]

    return commands
      .json_getAsync.apply(commands, params)
  }

  /**
   * Returns the list of `objects` in cache
   * @async
   * 
   * @param {string} keyNames The `key` name
   * @param {Object} [attrs = []] The list of specified `attrs` to return (`default:  all`)
   * @param {redis.Multi} [commands] The `redis` multi command object to chain(See {@link https://github.com/NodeRedis/node_redis#clientmulticommands})
   * 
   * @return {Promise<string>} The `objects` in cache
  */
  static _getListCache(keyNames, attrs = ['.'], commands = redis.multi()) {
    keyNames
      .forEach(keyName => {
        this
          ._getCache(keyName, attrs, commands)
      })
      
    return commands.execAsync()
  }

  /**
   * Sets the `object` to `keyName`
   * @async
   * 
   * @param {string} keyName The `key` name
   * @param {Object} object The `object`
   * @param {Object} [attr = '.'] The `attr` name
   * @param {redis.Multi} [commands = redis] The `redis` multi command object to chain(See {@link https://github.com/NodeRedis/node_redis#clientmulticommands})
   * 
   * @return {Promise<string>} The `status` of the operation
  */
  static _setCache(keyName, object, attr = '.', commands = redis) {
    let cacheString = object

    if (object && object instanceof Object) {
      cacheString = JSON
        .stringify({ ...object, last_sync: new Date() })
    }

    return commands
      .json_setAsync(keyName, attr, cacheString)
  }

  /**
    * Deletes the `keyName` from cache
    *
    * @param {string} keyName The `keyName`
    *
    * @return {Number} The count of deleted keys
  */
  static _delete(keyName) {
    return redis.json_delAsync(keyName)
  }
}

module.exports = GenericJSONCache