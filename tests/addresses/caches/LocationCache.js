'use strict'

const redis = require('lib/redis')

const Address = require('addresses/models/Address')

const KEY_NAME = 'locations'
const LOCATION_KEY_NAME = '{latitude}_{longitude}'

/**
 * The list of [`GEORADIUS` options]{@link https://redis.io/commands/georadius}
 * @type {Object}
 * 
 * @example
 * [
 *  'm',
 *  'WITHCOORD',
 *  'WITHDIST',
 *  'ASC'
 * ]
*/
const GEORADIUS_OPTIONS = [
  'm',
  'WITHCOORD',
  'WITHDIST',
  'ASC'
]

/**
 * Represents an `address` `location`
 * 
 * @class LocationCache
*/
class LocationCache {
  static get KEY_NAME()           { return KEY_NAME }
  static get LOCATION_KEY_NAME()  { return LOCATION_KEY_NAME }
  static get GEORADIUS_OPTIONS()  { return GEORADIUS_OPTIONS }

  /**
    * Return the key name
    *
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `address` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    *
    * @return {string} The key name
    * 
    * @example
    * 
    * LocationCache.getLocationKeyName(-10, -20)
    * // '-10_-20'
  */
  static getLocationKeyName(latitude, longitude) {
    const position = LocationCache
      ._getIdAttr(latitude, longitude)

    let locationKeyName = null

    if (position && position[0]) {
      locationKeyName = LOCATION_KEY_NAME
        .replace('{latitude}', position[0])
        .replace('{longitude}', position[1])
    }

    return locationKeyName
  }

  /**
    * Returns the `location` in cache
    *
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `location` object
    * @param {Number} longitude The `longitude`
    *
    * @return {Promise<Array>} The `location`
    *
    * @throws {Error} Any sort or error
  */
  static async getCache(latitude, longitude) {
    const locationKeyName = LocationCache
      .getLocationKeyName(latitude, longitude)

    const locationsCache = await redis
      .geoposAsync(KEY_NAME, locationKeyName)

    const location = locationsCache && locationsCache[0] ?
      locationsCache[0].reverse() :
      null

    return location
  }

  /**
    * Returns the nearest `location` key
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `location` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = LocationCache.Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    * @param {Array} options The list of [`GEORADIUS` `options`]{@link https://redis.io/commands/GEORADIUS}
    * 
    * @return {string} The nearest `location` key
    *
    * @throws {Error} Any sort or error
  */
  static async getNearest(latitude, longitude, radius = Address.MAX_DISTANCE) {
    const locationCache = await LocationCache
      ._getNearest(latitude, longitude, radius)

    let location = null

    if (locationCache)
      location = locationCache[0]

    return location
  }

  /**
    * Returns the nearest `location`
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `location` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = LocationCache.Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    * @param {Array} options The list of [`GEORADIUS` `options`]{@link https://redis.io/commands/GEORADIUS}
    * 
    * @return {Array} The nearest `location`
    *
    * @throws {Error} Any sort or error
  */
  static async getNearestLocation(latitude, longitude, radius = Address.MAX_DISTANCE) {
    const locationkeyName = await LocationCache
      .getNearest(latitude, longitude, radius)

    let location = null

    if (locationkeyName) {
      location = locationkeyName
        .split('_')
        .map(parseFloat)
    }

    return location
  }
  
  /**
    * Returns the nearest `location` key
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `location` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = LocationCache.Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    * @param {Array} [options = LocationCache.GEORADIUS_OPTIONS] The list of [`GEORADIUS` `options`]{@link https://redis.io/commands/GEORADIUS}
    * 
    * @return {Array} The nearest `location` key
    *
    * @throws {Error} Any sort or error
  */
  static async _getNearest(latitude, longitude, radius = Address.MAX_DISTANCE, options = LocationCache.GEORADIUS_OPTIONS) {
    const { position, maxDistance } = Address
      .getNearestParams(latitude, longitude, radius)

    const locationsCache = await redis
      .georadiusAsync.apply(redis, [ KEY_NAME, ...position.reverse(), maxDistance, ...options ])

    let locationCache = null

    if (locationsCache && locationsCache[0])
      locationCache = locationsCache[0]

    return locationCache
  }

  /**
    * Inserts the `location` in cache
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `location` object
    * @param {Number} longitude The `longitude`
    *
    * @return {Number} The inserted `location`
    *
    * @throws {Error} Any sort or error
  */
  static async set(latitude, longitude) {
    try {
      const position = LocationCache
        ._getIdAttr(latitude, longitude)

      let location = null

      if (position && position.length == 2) {
        const locationKeyName = LocationCache
          .getLocationKeyName(position)
  
        location = await redis
          .geoaddAsync.apply(redis, [ KEY_NAME, ...position.reverse(), locationKeyName ])
      }

      return location
    }
    catch (e) {
      console
        .error(`[LocationCache.set] ${latitude}, ${longitude}`, {
          error : e.message,
          stack : e.estack
        })

      throw e
    }
  }

  /**
    * Delete the `location` in cache
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `address` object
    * @param {Number} longitude The `longitude`
    *
    * @return {Object} The deleted `location` cache object
  */
  static async delete(latitude, longitude) {
    const locationCache = await LocationCache
      .getCache(latitude, longitude)

    if (locationCache) {
      const locationKeyName = LocationCache
        .getLocationKeyName(latitude, longitude)

      await redis
        .zremAsync(KEY_NAME, locationKeyName)
    }

    return locationCache
  }

  /**
   * Returns the `id` attr based on `address`'s type
   * 
   * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`) or the `latitude`
   * @param {Number} longitude The `trackerType` id
   * 
   * @return {Array} The id attr
   * 
   * @example
   * const address = new Address({
   *  location: [ -50, 21 ]
   * })
   * 
   * TerminalAddressCacheService
   *  ._getIdAttr(address)
   * // [ -50, 21 ]
   *
   * TerminalAddressCacheService
   *  ._getIdAttr(address.location)
   * // [ -50, 21 ]
   *
   * TerminalAddressCacheService
   *  ._getIdAttr(address.location[0], address.location[1])
   * // [ -50, 21 ]
  */
  static _getIdAttr(latitude, longitude) {
    let position = null

    if (latitude) {
      position = latitude instanceof Array ?
        [ ...latitude ] :
        [ latitude, longitude ]
  
      if (latitude instanceof Object && !(latitude instanceof Array))
        position = [ ...latitude.location ]
    }

    return position
  }
}

module.exports = LocationCache