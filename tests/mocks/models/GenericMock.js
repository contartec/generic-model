'use strict'

/**
 * Generic mock class for object's (or a list of) creation, insert, update, remove, etc
 * 
 * @class GenericMock
 * 
 * @example
 * 
 * class RandomClassMock extends GenericMock {
 *   static get MockClass() { return RandomClass }
 * 
 *   static getDefaultObject() {
 *     return {
 *       name        : 'arpel',
 *       description : '...'
 *     }
 *   }  
 * }
 * 
 * RandomClassMock.getMock()
 * // {
 * //   name        : 'arpel',
 * //   description : '...'
 * // }
 *
 * await RandomClassMock.add()
 * 
 * await RandomClass.find()
 * // [
 * //   {
 * //     name        : 'arpel',
 * //     description : '...'
 * //   }
 * // ]
*/
class GenericMock {
  /**
   * The `model` class
   * 
   * @description Override this with the desired `model` to mock
   * 
   * @type {Class}
   * @override
  */
  static get MockClass() { return null }
  
  /**
   * Returns the `defaultObject`
   * 
   * @description Override this with the desired `defaultObject`
   * Used by [`.getMock`]{@link GenericMock.getMockObject}, therefore, `all` subsequent methods
   * 
   * @type {Object}
   * @override
  */
  static getDefaultObject() { }

  /**
   * Returns the random mock object
   * 
   * @param {Object} params The object `params` to be merged with
   * 
   * @return {Object} The mock object
  */
  static getMockObject(params = {}) {
    const defaultObject = this
      .getDefaultObject()

    const paramsTemp = params && typeof(params.toJSON) == 'function' ?
      params.toJSON() :
      { ...params }

    return { ...defaultObject, ...paramsTemp }
  }

  /**
   * Returns the random mock 
   * 
   * @param {Object} params The object `params` to be merged with
   * 
   * @return {Generic} The mock
  */
  static getMock(params = {}) {
    const mockObject = this
      .getMockObject(params)

    return new this.MockClass(mockObject)
  }

  /**
   * Returns the random mock object
   * 
   * @param {Object} params The object `params` to be merged with
   * @param {Number} length The `length` of the returned `mocks`
   * 
   * @return {Array<Object>} The list of `mock` objects
  */
  static getMockObjects(params = {}, length = 3) {
    const mocks = []

    for (let i = 0; i < length; i++)
      mocks.push(this.getMockObject(params))

    return mocks
  }

  /**
   * Returns the list of `mocks` mocks
   * 
   * @param {Object} params The object `params` to be merged with
   * @param {Number} length The `length` of the returned `mocks`
   * 
   * @return {Array<Generic>} The list of `mocks`
  */
  static getMocks(params, length = 3) {
    const mocks = []

    for (let i = 0; i < length; i++)
      mocks.push(this.getMock(params))

    return mocks
  }

  /**
   * Inserts the `mock`
   * 
   * @param {Object} mockObject The `mock` object (if `null`, uses `this.getDefaultObject`)
   * 
   * @return {Promise<this.MockClass>} The inserted `mock`
  */
  static add(mockObject) {
    const mock = this.getMockObject(mockObject)
    
    return this.MockClass
      .create(mock)
  }

  /**
   * Inserts the `mocks`
   * @async
   * 
   * @param {Array<Generic> | Object} params The object `params` to set in every mock or a list of `mocks`
   * @param {Number} [length = 3] The number of `mocks` to be created
   * 
   * @return {Array<Generic>} The list of created `mocks`
  */
  static async addMocks(params, length = 3) {
    const mocks = params instanceof Array ?
      [ ...params ] :
      this.getMocks(params, length)

    const promises = []

    for (let i = mocks.length - 1; i >= 0; i--)
      promises.push(this.add(mocks[i].toJSON()))

    await Promise.all(promises)

    return mocks
  }

  /**
   * Removes the `mocks`
   * @async
   * 
   * @param {Array<Generic>} objects The list of `mocks` to be removed
   * 
   * @return {undefined}
  */
  static async remove(objects) {
    if (objects) {
      const objectsTemp = objects instanceof Array ?
        [ ...objects ] :
        [objects]
        
      for (let i = objectsTemp.length - 1; i >= 0; i--) {
        const id = objectsTemp[i] instanceof Object ?
          objectsTemp[i]._id :
          objectsTemp[i]

        await this.MockClass.findByIdAndRemove(id)
      }
    }

  }
}

module.exports = GenericMock