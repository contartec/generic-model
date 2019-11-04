const QueryBuilder = require('../utils/QueryBuilderUtils')

const QUERY_ATTR_NAMES = [
  'page',
  'pageSize',
  'orderBy',
  'genericSearch'
]

/**
 * Contains a set of chewed methods to handle documents
 * 
 * @class GenericModel
*/
class GenericModel {
  /**
   * The `attrs` list to (build the `query`) fetch the `documents`
   * 
   * @type {Array<string>}
   * @constant
  */
  static get QUERY_ATTR_NAMES() { return QUERY_ATTR_NAMES }

  /**
   * Returns the (`mongodb`'s) `filter` object
   * 
   * @param {Object} params The `filter` params
   * 
   * @return {Object} The `filter` object
  */
  static getFilterObject(params) {
    const filters = QueryBuilder
      .getFilterObject(params)

    if (params.genericSearch) {
      filters.$text = {
        $search: `"${params.genericSearch}"`
      }
    }

    QUERY_ATTR_NAMES
      .forEach(attrName => {
        delete filters[attrName]
      })

    return filters
  }

  /**
   * Returns the list of `Models`
   * 
   * @param {Object} params The `filter` params
   * 
   * @return {Promise<Array<Model>>} The list of `Models`
  */
  static getAll(params = {}) {
    const DEFAULT_PARAMS = {
      page      : 1,
      pageSize  : 500
    }

    const paramsTemp = { ...DEFAULT_PARAMS, ...params }

    const filters = this.getFilterObject(paramsTemp)

    const query = this
      .find(filters)
      .skip((paramsTemp.page - 1) * paramsTemp.pageSize)
      .limit(paramsTemp.pageSize)

    if (paramsTemp.orderBy) {
      // TODO : Confirma se ainda precisa disso depois.. (e/ou arranja um fix)
      const orderByParams = typeof(paramsTemp.orderBy) == 'string' ?
        JSON.parse(paramsTemp.orderBy) :
        JSON.parse(JSON.stringify(paramsTemp.orderBy))

      query.sort(orderByParams)
    }

    return query.exec()
  }

  /**
   * Returns the count of `Models`
   * 
   * @param {Object} params The `filter` params
   * 
   * @return {Promise<Number>} The count of `Models`
  */
  static getCount(params = {}) {
    const filters = this
      .getFilterObject(params)

    return this
      .countDocuments(filters)
  }

  /**
   * Returns the `Model`
   * 
   * @param {Object} params The `filter` params
   * 
   * @return {Promise<Model>} The `Model`
  */
  static getOne(params = {}) {
    const filters = this
      .getFilterObject(params)

    return this
      .findOne(filters)
  }

  /**
   * Saves the `Model`
   * 
   * @param {Object} object The `Model` object
   * 
   * @return {Promise<Model>} The saved `Model` object
  */
  static saveOrUpdate(object) {
    if (!object._id && object.id)
      object['_id'] = object.id

    return this
      .findByIdAndUpdate(
        object._id, 
        object, 
        {
          new           : true,
          upsert        : true,
          runValidators : true
        })
  }
}

module.exports = GenericModel