const mongoose = require('mongoose')

const URL = process.env.NODE_ENV != 'test' ?
  process.env.MONGODB_URL :
  process.env.MONGODB_URL_TEST

let db

mongoose.Promise = global.Promise

module.exports.connectToDatabase = async () => {
  if (!db) {
    db = await mongoose
      .connect(URL)
  }

  return db
}