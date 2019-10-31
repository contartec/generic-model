'use strict'

const GenericJSONCacheMock = require('tests/mocks/caches/GenericJSONCacheMock')
const AddressMock = require('addresses/tests/mocks/models/AddressMock')

const AddressCache = require('addresses/caches/AddressCache')
const LocationCache = require('addresses/caches/LocationCache')

/**
 * Mock class for [`AddressCache`]{@link AddressCache}
 * 
 * @class AddressCacheMock
 * @extends {GenericJSONCacheMock}
*/
class AddressCacheMock extends GenericJSONCacheMock {
  /**
   * Adds the `address` in cache
   * 
   * @param {Object} address The `address`
   * 
   * @return {Object} The inserted `address`
  */
  static async add(address) {
    const addressTemp = address ?
      { ...address } :
      AddressMock.getMock()

    const keyName = AddressCache
      .getKeyName(addressTemp)

    await LocationCache.set(addressTemp.location)

    await this._setCache(keyName, addressTemp)

    return addressTemp
  }

  /**
   * Adds the list of `addresses` in cache
   * 
   * @param {Array<Object>} addresses The list of `addresses`
   * 
   * @return {Promise<Object>} The list of `addresses`
  */
  static addList(addresses) {
    let promises = null

    if (addresses) {
      promises = addresses
        .map((k, index) => this.add(addresses[index]))
    }

    return promises
  }

  /**
   * Deletes the list of `addresses`
   * 
   * @param {(Array<Array> | Array<Object>)} locations The list of `locations` or `address` objects
   * 
   * @return {undefined}
   * 
   * @example
   * const positions = [ [ -10, 20 ], [ -8.23, -32.43 ] ]
   * 
   * AddressCacheMock.delete(positions)
   * 
   * @example
   * const addresses = await Address.getAll()
   * 
   * AddressCacheMock.delete(addresses)
  */
  static async delete(locations) {
    const locationsTemp = locations instanceof Array ?
      [ ...locations ] :
      [locations]

    let promises = []

    if (locations) {
      promises = locationsTemp
        .map(l => {
          const keyName = AddressCache
            .getKeyName(l)

          return [
            this._delete(keyName),
            LocationCache.delete(l)
          ]
        })
        .reduce((promisesTemp, promises) => {
          promisesTemp.push.apply(promisesTemp, promises)

          return promisesTemp
        })
      
      await Promise.all(promises)
    }
  }
}

module.exports = AddressCacheMock