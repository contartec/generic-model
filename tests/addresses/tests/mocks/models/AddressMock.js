'use strict'

const GenericMock = require('tests/mocks/models/GenericMock')

const Address = require('addresses/models/Address')

/**
 * Mock class for [`Address` model]{@link Address}
 * 
 * @class AddressMock
 * @extends {GenericMock}
*/
class AddressMock extends GenericMock {
  /**
   * The `mock` class for `GenericMock` usage
   * 
   * @type {Address}
  */
  static get MockClass() { return Address }

  /**
   * Returns the default mock object
   * 
   * @return {Object} The `default` object
  */
  static getDefaultObject() {
    return {
      street_name       : `street_name_${Math.round(Math.random() * 999999)}`,
      street_number     : `street_number_${Math.round(Math.random() * 999999)}`,
      postal_code       : `postal_code_${Math.round(Math.random() * 999999)}`,
      neighborhood      : `neighborhood_${Math.round(Math.random() * 999999)}`,
      city              : `city_${Math.round(Math.random() * 999999)}`,
      state             : `state_${Math.round(Math.random() * 999999)}`,
      state_short       : `state_short_${Math.round(Math.random() * 999999)}`,
      country           : 'Brasil',
      country_short     : 'BR',
      formatted_address : `formatted_address_${Math.round(Math.random() * 999999)}`,
      location          : [ -8.00128, -34.87363 ]
    }
  }

  static async addAddressLocations(locations) {
    const promises = locations
      .map(l =>
        AddressMock
          .add({
            location: l
          })
      )

    return await Promise.all(promises)
  }
}

module.exports = AddressMock