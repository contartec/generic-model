'use strict'

const mongoose = require('mongoose')

const genericSchema = require('lib/models/genericSchema')

const REQUIRED = { required: true }

const STRING_REQUIRED = {
  ...REQUIRED,
  type: String
}

const SCHEMA = {
  street_name       : STRING_REQUIRED,
  street_number     : String,
  postal_code       : String,
  neighborhood      : String,
  city              : STRING_REQUIRED,
  state             : STRING_REQUIRED,
  state_short       : String,
  country           : STRING_REQUIRED,
  country_short     : String,
  formatted_address : STRING_REQUIRED,
  google_place_id   : String,
  geometry          : {},
  location          : [],
  is_bus_station    : {
    type    : Boolean,
    default : false
  },
  types             : []
}

const OPTIONS = {
  _id         : true,
  strict      : true,
  timestamps  : {
    createdAt: 'created_at_ds',
    updatedAt: 'updated_at_ds'
  }
}

const { GenericModel, GenericSchema } = genericSchema(SCHEMA, OPTIONS, false)

/**
 * The `max distance` (in `meters`) between the `lat/lng` and the (assumed by us) `nearest` `address`
 * 
 * @type {Number}
 * @constant
*/
const MAX_DISTANCE = process.env.MAX_DISTANCE || 20

/**
 * The list of `addresses`' types related with `bus station`
 * 
 * @type {Array}
 * @constant
*/
const ADDRESS_BUS_STATION_TYPES = ['bus_station', 'transit_station']

/**
 * Represents the `Address` model in `db`
 * 
 * @class Address
 * @extends {GenericModel}
 * 
 * @property {string} street_name
 * @property {string} street_number
 * @property {string} postal_code
 * @property {string} neighborhood
 * @property {string} city
 * @property {string} state
 * @property {string} state_short
 * @property {string} country
 * @property {string} country_short
 * @property {string} formatted_address
 * @property {string} google_place_id
 * @property {Object} geometry The `geometry` object from `google.maps.GeocoderResult` (See {@link https://developers.google.com/maps/documentation/javascript/reference/geocoder#GeocoderResult})
 * @property {Array<Number>} location The `[ lat, lng ]`
 * @property {Boolean} is_bus_station Wether this `address` is a `bus station` or not (according to its [`types`]{@link https://developers.google.com/maps/documentation/geocoding/intro#Types})
 * @property {Array<string>} types The `address`' `types` (See {@link https://developers.google.com/maps/documentation/geocoding/intro#Types})
 * @property {Date} created_at_ds
 * @property {Date} updated_at_ds
*/
class Address extends GenericModel {
  static get MAX_DISTANCE()               { return MAX_DISTANCE }

  /**
   * Returns whether the `address` is a `bus station` or not
   * 
   * @return {Boolean} Whether the `address` is a `bus station` or not
  */
  isBusStation() {
    return Address.isBusStation(this)
  }

  /**
   * Sets the `is_bus_station` attr based on its `types`
   * 
   * @return {Address} `this`
  */
  setIsBusStation() {
    this.is_bus_station = this.isBusStation()

    return this
  }

  setLocation() {
    if (this.geometry) {
      this.location = [
        this.geometry.location.lat,
        this.geometry.location.lng
      ]
    }

    return this
  }

  /**
   * Returns the `nearest` `adress` given a `lat/lng` inside a `radius`
   * @async
   * 
   * @param {Array<Number> | Number} latitude The `position` (`[ lat, lng ]`) or the `latitude`
   * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
   * @param {Number} [radius = MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link MAX_DISTANCE})
   * 
   * @return {Promise<Address>} The nearest `adress`
  */
  static getNearest(latitude, longitude, radius = MAX_DISTANCE) {
    const { position, maxDistance } = Address
      .getNearestParams(latitude, longitude, radius)

    const filterParams = {
      location: {
        $near         : position,
        $maxDistance  : parseFloat((maxDistance / 100 / 111.12).toFixed(5))
      }
    }

    return this
      .findOne(filterParams)
  }

  /**
   * Returns the `nearest` params
   * 
   * @param {Array<Number> | Number} latitude The `position` (`[ lat, lng ]`) or the `latitude`
   * @param {Number} longitude The `longitude` or `radius` if `latitude` is an `Array`
   * @param {Number} [radius = MAX_DISTANCE] The `radius` in `meters` (default [`MAX_DISTANCE`]{@link MAX_DISTANCE})
   * 
   * @return {Object} The `nearest` params
  */
  static getNearestParams(latitude, longitude, radius = MAX_DISTANCE) {
    let position = [ latitude, longitude ]
    let maxDistance = radius

    if (latitude instanceof Array) {
      position = [ ...latitude ]

      if (longitude)
        maxDistance = longitude
    }

    return { position, maxDistance }
  }

  /**
   * Returns whether the `address` is a `bus station` or not
   * 
   * @param {(Address | Object)} address The `address` object
   * 
   * @return {Boolean} Whether the `address` is a `bus station` or not
  */
  static isBusStation(address) {
    return ADDRESS_BUS_STATION_TYPES
      .find(type => address.types.includes(type)) != null
  }
}

GenericSchema
  .loadClass(Address)
  .index({
    location: '2d'
  })
  .pre('save', function(next) {
    this
      .setLocation()
      .setIsBusStation()

    next()
  })

module.exports = mongoose.model('Address', GenericSchema)