'use strict'

const GenericJSONCache = require('lib/caches/GenericJSONCache')

const LocationCache = require('addresses/caches/LocationCache')
const Address = require('addresses/models/Address')

const KEY_NAME = 'addresses:{latitude}_{longitude}'

/**
 * Represents [`address`]{@link Address} in `cache`
 * 
 * @class AddressCache
 * @extends {GenericJSONCache}
*/
class AddressCache extends GenericJSONCache {
  static get KEY_NAME()           { return KEY_NAME }

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
    * AddressCache.getKeyName(-10, -20)
    * // 'addresses:-10_-20'
  */
  static getKeyName(latitude, longitude) {
    const position = AddressCache
      ._getIdAttr(latitude, longitude)

    return KEY_NAME
      .replace('{latitude}', position[0])
      .replace('{longitude}', position[1])
  }

  /**
   * Returns the `addressCache` cache object
   * @async
   * 
   * @param {(string | Object)} latitude The `terminal` id or `addressCache` object
   * @param {Number} longitude The `trackerType` id
   * @param {Object} [params = {}] An object with a set of params to fetch the object
   * @param {Object} [params.attrs = []] The list of [`Address` `attrs`]{@link Address} to return (`default:  all`)
   * 
   * @return {*} The `addressCache` cache object
  */
  static async getCache(latitude, longitude, params = {}) {
    const keyName = AddressCache
      .getKeyName(latitude, longitude)

    let addressCache = await AddressCache
      ._getCache(keyName, params.attrs)

    addressCache = AddressCache
      .parseCacheString(addressCache)
    
    return addressCache
  }

  /**
    * Returns the nearest `address` in cache
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `address` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    *
    * @return {Object} The nearest `address` in cache
    *
    * @throws {Error} Any sort or error
  */
  static async getNearestCache(latitude, longitude, radius = Address.MAX_DISTANCE) {
    try {
      const location = await LocationCache
        .getNearestLocation(latitude, longitude, radius)

      let addressCache = null

      if (location) {
        addressCache = await AddressCache
          .getCache(location)

        if (!addressCache)
          await LocationCache.delete(location)
      }

      return addressCache      
    }
    catch (e) {
      console
        .error(`[AddressCache.getNearestCache] ${latitude}, ${longitude} ${radius}m`, {
          error : e.message,
          stack : e.estack
        })

      throw e
    }
  }

  /**
    * Returns the nearest `address` in cache
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `address` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    *
    * @return {Object} The nearest `address`
    *
    * @throws {Error} Any sort or error
  */
  static async getNearest(latitude, longitude, radius = Address.MAX_DISTANCE) {
    try {
      let address = await AddressCache
        .getNearestCache(latitude, longitude, radius)

      if (!address) {
        address = await AddressCache
          .setNearest(latitude, longitude, radius)
      }

      return address
    }
    catch (e) {
      console
        .error(`[AddressCache.getNearest] ${latitude}, ${longitude} ${radius}m`, {
          error : e.message,
          stack : e.estack
        })

      throw e
    }
  }

  /**
    * Sets the nearest `address` in cache
    * @async
    * 
    * @param {(Array<Number> | Number | Object)} latitude The `position` (`[ lat, lng ]`), the `latitude` or the `address` object
    * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
    * @param {Number} [radius = Address.MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link Address.MAX_DISTANCE})
    *
    * @return {Object} The nearest `address`
    *
    * @throws {Error} Any sort or error
  */
  static async setNearest(latitude, longitude, radius) {
    try {
      let address = await Address
        .getNearest(latitude, longitude, radius)

      if (address) {
        address = address.toObject()

        await AddressCache.setCache(address)
      }

      return address
    }
    catch (e) {
      console
        .error(`[AddressCache.setNearest] ${latitude}, ${longitude} ${radius}m`, {
          error : e.message,
          stack : e.estack
        })

      throw e
    }
  }

  /**
   * Sets the `address` to its respective cache key (_if newer than current cache_)
   * @async
   * 
   * @param {(Object | Address)} address The `address` object
   * 
   * @return {string} The `status` of the operation
  */
  static async setCache(address) {
    let response = null

    if (address) {
      const keyName = AddressCache
        .getKeyName(address)

      response = await AddressCache
        ._setCache(keyName, address)

      if (response)
        await LocationCache.set(address.location)
    }

    return response
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
    let position = latitude instanceof Array ?
      [ ...latitude ] :
      [ latitude, longitude ]

    if (latitude instanceof Object && !(latitude instanceof Array))
      position = [ ...latitude.location ]

    return position
  }
}

Address
  .on('save', address => {
    AddressCache
      .setCache(address.toJSON())
  })

module.exports = AddressCache