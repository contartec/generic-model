'use strict'

const GenericJSONCache = require('lib/caches/GenericJSONCache')

/**
 * Mock class for [`GenericJSONCache`]{@link GenericJSONCache}
 * 
 * @class GenericJSONCacheMock
 * @extends {GenericJSONCache}
*/
class GenericJSONCacheMock extends GenericJSONCache {
  /**
   * Adds the `keyName/object` in cache
   * 
   * @param {string} keyName The `keyName`
   * @param {Object} object The `object`
   * 
   * @return {string} The `status`
  */
  static add(keyName, object) {
    return this._setCache(keyName, object)
  }

  /**
   * Adds the list of `keyNames/objects` in cache
   * 
   * @param {Array<string>} keyNames The list of `keyNames`
   * @param {Array<Object>} objects The list of `objects`
   * 
   * @return {Promise<string>} The list of `status`
  */
  static addList(keyNames, objects) {
    let promises = null

    if (keyNames) {
      promises = keyNames
        .map((k, index) => this.add(k, objects[index]))
    }

    return promises
  }

  /**
    * Deletes the `keyNames` from cache
    * @async
    *
    * @param {(Array<string> | string)} keyNames The list of `keyNames`
    *
    * @return {Array<Number>} The count of deleted keys
  */
  static async delete(keyNames) {
    const keyNamesTemp = keyNames instanceof Array ?
      [ ...keyNames ] :
      [keyNames]

    let promises = null

    if (keyNamesTemp[0])
      promises = keyNamesTemp.map(k => this._delete(k))

    return promises
  }
}

module.exports = GenericJSONCacheMock