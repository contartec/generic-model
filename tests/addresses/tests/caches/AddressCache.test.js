'use strict'

const redis = require('lib/redis')

const AddressCache = require('addresses/caches/AddressCache')

const Address = require('addresses/models/Address')

const AddressMock = require('addresses/tests/mocks/models/AddressMock')
const AddressCacheMock = require('addresses/tests/mocks/caches/AddressCacheMock')

describe('AddressCache', () => {
  const POSITIONS = [
    [ -8.00292, -34.87250 ],
    [ -8.00292, -34.87270 ],
    [ -8.00194, -34.87310 ],
    [ -8.00128, -34.87360 ]
  ]

  async function tearDown(addresses) {
    await AddressMock
      .remove(addresses)

    await AddressCacheMock
      .delete(addresses)
  }

  describe('.getKeyName', () => {
    const LATITUDE = -8.00292
    const LONGITUDE = -34.8726

    context('when `latitude` is a `Number`', () => {
      let keyName

      before(() => {
        keyName = AddressCache
          .getKeyName(LATITUDE, LONGITUDE)
      })

      it('should return the key name', () => {
        const keyNameTemp = AddressCache
          .KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(keyName).to.eql(keyNameTemp)
      })
    })

    context('when `latitude` is an `Array`', () => {
      let keyName

      before(() => {
        const position = [ LATITUDE, LONGITUDE ]

        keyName = AddressCache
          .getKeyName(position)
      })

      it('should return the key name', () => {
        const keyNameTemp = AddressCache.KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(keyName).to.eql(keyNameTemp)
      })
    })

    context('when `latitude` is an `Object`', () => {
      let keyName

      before(() => {
        const address = new Address({
          location: [ LATITUDE, LONGITUDE ]
        })

        keyName = AddressCache
          .getKeyName(address)
      })

      it('should return the key name', () => {
        const keyNameTemp = AddressCache.KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(keyName).to.eql(keyNameTemp)
      })
    })
  })

  describe('.getCache', () => {
    context('when ´address` is cached', () => {
      const POSITION = [ -8.00194, -34.8731 ]

      let addressCached

      before(async () => {
        addressCached = {
          location: POSITION
        }

        const keyName = AddressCache
          .getKeyName(addressCached)

        await redis
          .json_setAsync(keyName, '.', JSON.stringify(addressCached))
      })

      after(async () => {
        const keyName = AddressCache
          .getKeyName(addressCached.id)

        await redis.json_delAsync(keyName)
      })

      let addressCache

      before(async () => {
        addressCache = await AddressCache
          .getCache(addressCached)
      })

      it('should return the cached object with the specified `attrs`', () => {
        expect(addressCache).to.deep.equal(addressCached)
      })
    })

    context('when ´address` is not cached', () => {
      const POSITION = [ -5.252, -2.525 ]

      it('should return `null`', async () => {
        const addressCache = await AddressCache
          .getCache(POSITION)

        expect(addressCache).to.be.null
      })
    })
  })

  describe('.getNearestCache', () => {
    const POSITIONS = [
      [ -8.00292, -34.8726 ],
      [ -8.00292, -34.8727 ],
      [ -8.00194, -34.8731 ],
      [ -8.00128, -34.8736 ]
    ]

    context('when there are cached `addresses`', () => {
      let addresses

      before(async () => {
        const promises = []
  
        addresses = []
        
        POSITIONS
          .forEach(p => {
            const address = AddressMock
              .getMockObject({
                location: p
              })
  
            addresses.push(address)
  
            promises
              .push(AddressCacheMock.add(address))
          })
  
        await Promise.all(promises)
      })

      after(async () => await AddressCacheMock.delete(addresses))

      context('when there is a near `location`', () => {
        let nearestAddress
  
        before(() => {
          nearestAddress = addresses[0]
        })
  
        context('when `latitude` is a `Number`', () => {
          let latitude, longitude
  
          before(() => {
            latitude = nearestAddress.location[0]
            longitude = nearestAddress.location[1] + .00012
          })

          context('when `radius` is a `Number`', () => {
            const RADIUS = 20

            let nearestAddressCache

            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, longitude, RADIUS)
            })

            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
  
          context('when `radius` is `undefined`', () => {
            const RADIUS = undefined
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, longitude, RADIUS)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
        })
  
        context('when `latitude` is an `Array`', () => {
          let latitude
  
          before(() => {
            latitude = [ ...nearestAddress.location ]
          })
  
          context('when `longitude` is a `Number`', () => {
            const LONGITUDE = 20
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, LONGITUDE)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
  
          context('when `longitude` is `undefined`', () => {
            const LONGITUDE = undefined
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, LONGITUDE)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
        })
      })

      context('when there is no near `location`', () => {
        let location
  
        before(async () => {
          const position = [ ...POSITIONS[0] ]
          const radius = 20
  
          position[0] += .1334
  
          location = await AddressCache
            .getNearestCache(position, radius)
        })
  
        it('should return `null`', () => {
          expect(location).to.not.exist
        })
      })
    })

    context('when there are no cached `addresses`', () => {
      const RADIUS = 20
  
      let nearestAddressCache

      before(async () => {
        nearestAddressCache = await AddressCache
          .getNearestCache(POSITIONS[0], RADIUS)
      })

      it('should return `null`', () => {
        expect(nearestAddressCache).to.not.exist
      })
    })
  })

  describe('.getNearest', () => {
    context('when there are cached `addresses`', () => {
      let addresses

      before(async () => {
        const promises = []
  
        addresses = []
        
        POSITIONS
          .forEach(p => {
            const address = AddressMock
              .getMockObject({
                location: p
              })
  
            addresses.push(address)

            promises
              .push(AddressCacheMock.add(address))
          })
  
        await Promise.all(promises)
      })

      after(async () => await AddressCacheMock.delete(addresses))

      context('when there is a near `location`', () => {
        let nearestAddress
  
        before(() => {
          nearestAddress = addresses[0]
        })
  
        context('when `latitude` is a `Number`', () => {
          let latitude, longitude
  
          before(() => {
            latitude = nearestAddress.location[0]
            longitude = nearestAddress.location[1] + .00012
          })

          context('when `radius` is a `Number`', () => {
            const RADIUS = 20

            let nearestAddressCache

            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, longitude, RADIUS)
            })

            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
  
          context('when `radius` is `undefined`', () => {
            const RADIUS = undefined
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, longitude, RADIUS)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
        })
  
        context('when `latitude` is an `Array`', () => {
          let latitude
  
          before(() => {
            latitude = [ ...nearestAddress.location ]
          })
  
          context('when `longitude` is a `Number`', () => {
            const LONGITUDE = 20
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, LONGITUDE)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
  
          context('when `longitude` is `undefined`', () => {
            const LONGITUDE = undefined
  
            let nearestAddressCache
  
            before(async () => {
              nearestAddressCache = await AddressCache
                .getNearestCache(latitude, LONGITUDE)
            })
  
            it('should return the `nearest` `address`', () => {
              expect(nearestAddressCache).to.shallowDeepEqual(nearestAddress)
            })
          })
        })
      })

      context('when there is no near `location`', () => {
        let location
  
        before(async () => {
          const position = [ ...POSITIONS[0] ]
          const radius = 20
  
          position[0] += .1334
  
          location = await AddressCache
            .getNearestCache(position, radius)
        })
  
        it('should return `null`', () => {
          expect(location).to.not.exist
        })
      })
    })

    context('when there are no cached `addresses`', () => {
      context('when there are persisted `addresses`', () => {
        context('when there is a near `location`', () => {
          context('when `latitude` is a `Number`', () => {
            context('when `radius` is a `Number`', () => {
              const RADIUS = 20
  
              let addresses, nearestAddressDB, nearestAddress
  
              before(async () => {
                addresses = await AddressMock.addAddressLocations(POSITIONS)

                nearestAddressDB = addresses[0]

                const latitude = nearestAddressDB.location[0]
                const longitude = nearestAddressDB.location[1] + .00010

                nearestAddress = await AddressCache
                  .getNearest(latitude, longitude, RADIUS)
              })

              after(async () => await tearDown(addresses))
  
              it('should return the `nearest` `address`', () => {
                expect(new Address(nearestAddress).toJSON({ virtuals: false })).to.eql(nearestAddressDB.toJSON({ virtuals: false }))
              })
            })
    
            context('when `radius` is `undefined`', () => {
              const RADIUS = undefined
    
              let addresses, nearestAddressDB, nearestAddress
    
              before(async () => {
                addresses = await AddressMock.addAddressLocations(POSITIONS)

                nearestAddressDB = addresses[0]

                const latitude = nearestAddressDB.location[0]
                const longitude = nearestAddressDB.location[1] + .00012

                nearestAddress = await AddressCache
                  .getNearest(latitude, longitude, RADIUS)
              })

              after(async () => await tearDown(addresses))
    
              it('should return the `nearest` `address`', () => {
                expect(new Address(nearestAddress).toJSON({ virtuals: false })).to.eql(nearestAddressDB.toJSON({ virtuals: false }))
              })
            })
          })
    
          context('when `latitude` is an `Array`', () => {    
            context('when `longitude` is a `Number`', () => {
              let addresses, nearestAddressDB, nearestAddress
    
              before(async () => {
                addresses = await AddressMock.addAddressLocations(POSITIONS)

                nearestAddress = addresses[0]

                const latitude = [ ...nearestAddress.location ]
                const longitude = 20

                nearestAddressDB = await AddressCache
                  .getNearest(latitude, longitude)
              })

              after(async () => await tearDown(addresses))

              it('should return the `nearest` `address`', () => {
                expect(JSON.parse(JSON.stringify(nearestAddressDB))).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddress)))
              })
            })

            context('when `longitude` is `undefined`', () => {
              let addresses, nearestAddressDB, nearestAddress

              before(async () => {
                addresses = await AddressMock.addAddressLocations(POSITIONS)

                nearestAddressDB = addresses[0]

                const latitude = [ ...nearestAddressDB.location ]
                const longitude = 20

                nearestAddress = await AddressCache
                  .getNearest(latitude, longitude)
              })

              after(async () => await tearDown(addresses))

              it('should return the `nearest` `address`', () => {
                expect(JSON.parse(JSON.stringify(nearestAddress))).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddressDB)))
              })
            })
          })
        })
  
        context('when there is no near `location`', () => {
          let nearestAddress

          before(async () => {
            const position = [ ...POSITIONS[0] ]
            const radius = 20

            position[0] += .1334

            nearestAddress = await AddressCache
              .getNearest(position, radius)
          })

          it('should return `null`', () => {
            expect(nearestAddress).to.not.exist
          })
        })
      })

      context('when there are not persisted `addresses`', () => {
        const RADIUS = 20
    
        let nearestAddress

        before(async () => {
          nearestAddress = await AddressCache
            .getNearestCache(POSITIONS[0], RADIUS)
        })

        it('should return `null`', () => {
          expect(nearestAddress).to.not.exist
        })
      })
    })
  })

  describe('.setNearest', () => {
    context('when there are persisted `addresses`', () => {
      context('when there is a near `location`', () => {
        context('when `latitude` is a `Number`', () => {
          context('when `radius` is a `Number`', () => {
            const RADIUS = 20

            let addresses, nearestAddressDB, nearestAddress

            before(async () => {
              addresses = await AddressMock.addAddressLocations(POSITIONS)

              nearestAddressDB = addresses[0]

              const latitude = nearestAddressDB.location[0]
              const longitude = nearestAddressDB.location[1] + .00010

              nearestAddress = await AddressCache
                .setNearest(latitude, longitude, RADIUS)
            })

            after(async () => await tearDown(addresses))

            it('should return the nearest `address`', () => {
              expect(nearestAddress).to.shallowDeepEqual(nearestAddressDB.toJSON())
            })

            it('should save the nearest `address` in cache', async () => {
              const nearestAddressTemp = await AddressCache
                .getCache(nearestAddressDB.location)

              expect(nearestAddressTemp).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddress)))
            })
          })

          context('when `radius` is `undefined`', () => {
            const RADIUS = undefined

            let addresses, nearestAddressDB, nearestAddress

            before(async () => {
              addresses = await AddressMock.addAddressLocations(POSITIONS)

              nearestAddressDB = addresses[0]

              const latitude = nearestAddressDB.location[0]
              const longitude = nearestAddressDB.location[1] + .00012

              nearestAddress = await AddressCache
                .setNearest(latitude, longitude, RADIUS)
            })

            after(async () => await tearDown(addresses))

            it('should return the `nearest` `address`', () => {
              expect(nearestAddress).to.shallowDeepEqual(nearestAddressDB.toJSON())
            })

            it('should save the nearest `address` in cache', async () => {
              const nearestAddressTemp = await AddressCache
                .getCache(nearestAddressDB.location)

              expect(nearestAddressTemp).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddress)))
            })
          })
        })
  
        context('when `latitude` is an `Array`', () => {
          context('when `longitude` is a `Number`', () => {
            let addresses, nearestAddressDB, nearestAddress
  
            before(async () => {
              addresses = await AddressMock.addAddressLocations(POSITIONS)

              nearestAddress = addresses[0]

              const latitude = [ ...nearestAddress.location ]
              const longitude = 20

              nearestAddressDB = await AddressCache
                .setNearest(latitude, longitude)
            })

            after(async () => await tearDown(addresses))

            it('should return the `nearest` `address`', () => {
              expect(nearestAddressDB).to.shallowDeepEqual(nearestAddress.toJSON())
            })

            it('should save the nearest `address` in cache', async () => {
              const nearestAddressTemp = await AddressCache
                .getCache(nearestAddressDB.location)

              expect(nearestAddressTemp).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddress)))
            })
          })

          context('when `longitude` is `undefined`', () => {
            let addresses, nearestAddressDB, nearestAddress

            before(async () => {
              addresses = await AddressMock.addAddressLocations(POSITIONS)

              nearestAddressDB = addresses[0]

              const latitude = [ ...nearestAddressDB.location ]
              const longitude = 20

              nearestAddress = await AddressCache
                .setNearest(latitude, longitude)
            })

            after(async () => await tearDown(addresses))

            it('should return the `nearest` `address`', () => {
              expect(nearestAddress).to.shallowDeepEqual(nearestAddressDB.toJSON())
            })

            it('should save the nearest `address` in cache', async () => {
              const nearestAddressTemp = await AddressCache
                .getCache(nearestAddressDB.location)

              expect(nearestAddressTemp).to.shallowDeepEqual(JSON.parse(JSON.stringify(nearestAddress)))
            })
          })
        })
      })

      context('when there is no near `location`', () => {
        let nearestAddress
  
        before(async () => {
          const position = [ ...POSITIONS[0] ]
          const radius = 20
  
          position[0] += .1334
  
          nearestAddress = await AddressCache
            .setNearest(position, radius)
        })
  
        it('should return `null`', () => {
          expect(nearestAddress).to.not.exist
        })
      })
    })

    context('when there are not persisted `addresses`', () => {
      const RADIUS = 20
  
      let nearestAddress

      before(async () => {
        nearestAddress = await AddressCache
          .setNearest(POSITIONS[0], RADIUS)
      })

      it('should return `null`', () => {
        expect(nearestAddress).to.not.exist
      })
    })
  })

  describe('.parseCacheString', () => {
    context('when `cacheString` is `string`', () => {
      context('when `cacheString` starts/ends with `"`', () => {
        const VALUE = 'la'
        const CACHE_STRING = `"${VALUE}"`

        it('should return the `value` without `"`', () => {
          const cacheStringParsed = AddressCache
            .parseCacheString(CACHE_STRING)

          expect(cacheStringParsed).to.eql(VALUE)
        })
      })
 
      context('when `cacheString` starts/ends with `[]`', () => {
        const VALUE = [ { id: 'aa:bb:cc:dd:ee:ff' } ]
        const CACHE_STRING = `${JSON.stringify(VALUE)}`

        it('should return the `Array`', () => {
          const cacheStringParsed = AddressCache
            .parseCacheString(CACHE_STRING)

          expect(cacheStringParsed).to.eql(VALUE)
        })
      })

      context('when `cacheString` starts/ends with `{}`', () => {
        const VALUE = { id: 'aa:bb:cc:dd:ee:ff' }
        const CACHE_STRING = `${JSON.stringify(VALUE)}`

        it('should return the `Object`', () => {
          const cacheStringParsed = AddressCache
            .parseCacheString(CACHE_STRING)

          expect(cacheStringParsed).to.eql(VALUE)
        })
      })
    })

    context('when `cacheString` is `null`', () => {
      it('should return `null`', () => {
        const cacheStringParsed = AddressCache
          .parseCacheString(null)

        expect(cacheStringParsed).to.not.exist
      })
    })
  })

  describe('.setCache', () => {
    context('when `address` is not `null`', () => {
      context('when `address` is an `Object`', () => {
        const ADDRESS = AddressMock
          .getMockObject()

        let status

        before(async () => {
          status = await AddressCache
            .setCache(ADDRESS)
        })

        after(async () => {
          const keyName = AddressCache
            .getKeyName(ADDRESS.terminal_id, ADDRESS.tracker_type_id)

          await redis
            .json_delAsync(keyName)
        })

        it('should return the `redis` status operation', () => {
          expect(status).to.exist
        })

        it('should save the `address` in `cache`', async () => {
          const addressCache = await AddressCache
            .getCache(ADDRESS)

          expect(addressCache).to.shallowDeepEqual(ADDRESS)
        })
      })
    })

    context('when `address` is `null`', () => {
      let status

      before(async () => {
        status = await AddressCache
          .setCache(null)
      })

      it('should return `null`', () => {
        expect(status).to.not.exist
      })
    })
  })

  describe('Address.on', () => {
    describe('save', () => {
      context('when `address` is cached', () => {
        let address

        before(async () => {
          address = AddressMock.getMock()

          await AddressCacheMock.add(address.toJSON())

          address = await address.save()
        })

        after(async () => await tearDown(address))

        it('should update the `address` in `cache`', async () => {
          const addressCache = await AddressCache
            .getCache(address.location)

          expect(new Address(addressCache).toJSON({ virtuals: false })).to.eql(address.toJSON({ virtuals: false }))
        })
      })

      context('when `address` is not cached', () => {
        let address

        before(async () => {
          address = AddressMock.getMock()

          address = await address.save()
        })

        after(async () => await tearDown(address))

        it('should save the `address` in `cache`', async () => {
          const addressCache = await AddressCache
            .getCache(address.location)

          expect(new Address(addressCache).toJSON({ virtuals: false })).to.eql(address.toJSON({ virtuals: false }))
        })
      })
    })
  })
})