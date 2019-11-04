'use strict'

const mongoose = require('mongoose')
const mongooseLifecycle = require('mongoose-lifecycle')

const DB = require('../db')

const GenericModel = require('./GenericModel')

const EVENTS = [
  'save',
  'remove',
  'count',
  'deleteMany',
  'deleteOne',
  'find',
  'findOne',
  'findOneAndDelete',
  'findOneAndRemove',
  'findOneAndUpdate',
  'remove',
  'update',
  'updateOne',
  'updateMany'
]

/**
 * Inits the [`GenericModel`]{@link GenericModel} as a `mongoose` class (using/inheriting `mongoose.Schema`, obviously)
 * 
 * @description
 *  Besides preparing `GenericModel` to be happily inherited as a `mongoose.Schema` super class:
 * 
 *  - Enable `Lambda` like functionality for `db` connections
 *  - Broadcast model events (see [`mongoose-lifecycle`]{@link https://www.npmjs.com/package/mongoose-lifecycle}) 
 * 
 * @param {mongoose.Schema} schema The `mongoose` schema object
 * @param {Object} options The `schema` options
 * @param {Boolean} [shouldCreateDBConnection = true] Whether each `db` command should create a `connection` or not (for `Lambda` and others)
 * 
 * @return {Object} The [`GenericModel`]{@link GenericModel} and its [`Schema`]{@link https://mongoosejs.com/docs/api/schema.html#schema_Schema}
 * 
 * @see {@link https://mongoosejs.com/docs/guide.html}
 * 
 * @example
 * 
 * // You.js
 * const { GenericModel, GenericSchema } = require('lib/models/GenericSchema')(SCHEMA, OPTIONS)
 * 
 * module.exports = mongoose.model('You', GenericSchema)
 * 
 * // file.js
 * const You = require('./You')
 * 
 * You.save({ name: 'you' })
 * 
 * const you = await You.getOne({ name: 'you' })
 * // {
 * //   _id : idRandom,
 * //   name: 'you'
 * // }
 * 
 * you.name = 'arpel'
 * 
 * await you.save()
 * 
 * await You.getAll()
 * // [(1)]
 *
 * await You.find()
 * // [(1)]
 * 
 * @example
 * 
 * // You.js
 * const { GenericModel, GenericSchema } = require('lib/models/GenericSchema')(SCHEMA, OPTIONS)
 * 
 * class You extends GenericModel {
 *    arpel() {
 *      this.name = 'arpel'
 * 
 *      return this.save()
 *    }
 * 
 *    static async arpel() {
 *      return You.save({ name: 'arpel' })
 *    }
 * }
 * 
 * module.exports = mongoose.model('You', GenericSchema)
 * 
 * // file.js
 * const You = require('./You')
 * 
 * const you = new You()
 *
 * await you.arpel()
 * await You.arpel()
 * 
 * You.getCount({ name: 'arpel' })
 * // 2
 *
 * You.count({ name: 'arpel' })
 * // 2
*/
function genericSchema(schema, options, shouldCreateDBConnection = true) {
  const GenericSchema = new mongoose.Schema(schema, options)

  if (shouldCreateDBConnection) {
    EVENTS
      .forEach(event => {
        GenericSchema
          .pre(event, async () => await DB.connectToDatabase())
      })
  }

  GenericSchema
    .loadClass(GenericModel)
    .plugin(mongooseLifecycle)

  return { GenericModel, GenericSchema }
}

module.exports = genericSchema