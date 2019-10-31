'use strict'

const redis = require('lib/redis')

const LocationCache = require('addresses/caches/LocationCache')

describe('LocationCache', () => {
  describe('.getLocationKeyName', () => {
    const LATITUDE = -8.00292
    const LONGITUDE = -34.8726

    context('when `latitude` is a `Number`', () => {
      let locationKeyName

      before(() => {
        locationKeyName = LocationCache
          .getLocationKeyName(LATITUDE, LONGITUDE)
      })

      it('should return the key name', () => {
        const locationKeyNameTemp = LocationCache.LOCATION_KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(locationKeyName).to.eql(locationKeyNameTemp)
      })
    })

    context('when `latitude` is an `Array`', () => {
      let locationKeyName

      before(() => {
        const position = [ LATITUDE, LONGITUDE ]

        locationKeyName = LocationCache
          .getLocationKeyName(position)
      })

      it('should return the key name', () => {
        const locationKeyNameTemp = LocationCache.LOCATION_KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(locationKeyName).to.eql(locationKeyNameTemp)
      })
    })

    context('when `latitude` is an `Object`', () => {
      let locationKeyName

      before(() => {
        const location = {
          location: [ LATITUDE, LONGITUDE ]
        }

        locationKeyName = LocationCache
          .getLocationKeyName(location)
      })

      it('should return the key name', () => {
        const locationKeyNameTemp = LocationCache.LOCATION_KEY_NAME
          .replace('{latitude}', LATITUDE)
          .replace('{longitude}', LONGITUDE)

        expect(locationKeyName).to.eql(locationKeyNameTemp)
      })
    })
  })

  describe('.getCache', () => {
    context('when ´location` is cached', () => {
      const LOCATION = [ -8.00194, -34.8731 ]

      let locationCache

      before(async () => {
        const locationKeyName = LocationCache
          .getLocationKeyName(LOCATION)

        await redis
          .geoadd.apply(redis, [ LocationCache.KEY_NAME, ...[ ...LOCATION ].reverse(), locationKeyName ])

        locationCache = await LocationCache
          .getCache(LOCATION)
      })

      after(async () => await redis.delAsync(LocationCache.KEY_NAME))

      it('should return the cached `location`', () => {
        expect(locationCache.map(l => parseFloat(parseFloat(l).toFixed(5)))).to.shallowDeepEqual(LOCATION)
      })
    })

    context('when ´location` is not cached', () => {
      const LOCATION = [ -5.252, -2.525 ]

      it('should return `null`', async () => {
        const locationCache = await LocationCache
          .getCache(LOCATION)

        expect(locationCache).to.be.null
      })
    })
  })

  describe('.getNearest', () => {
    const POSITIONS = [
      [ -8.00292, -34.8726 ],
      [ -8.00292, -34.8727 ],
      [ -8.00194, -34.8731 ],
      [ -8.00128, -34.8736 ]
    ]

    before(async () => {
      const promises = POSITIONS
        .map(p => {
          return LocationCache
            .set(p)
        })

      await Promise.all(promises)
    })

    after(async () => await redis.delAsync(LocationCache.LOCATION_KEY_NAME))

    context('when there is a near `location`', () => {
      let nearestLocation

      before(() => {
        nearestLocation = [ ...POSITIONS[0] ]
      })

      context('when `latitude` is a `Number`', () => {
        let latitude, longitude

        before(() => {
          latitude = nearestLocation[0]
          longitude = nearestLocation[1] + .00012
        })

        context('when `radius` is a `Number`', () => {
          const RADIUS = 20

          let nearestLocationKeyName

          before(async () => {
            nearestLocationKeyName = await LocationCache
              .getNearest(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            const locationKeyName = LocationCache
              .getLocationKeyName(nearestLocation)

            expect(nearestLocationKeyName).to.eql(locationKeyName)
          })
        })

        context('when `radius` is `undefined`', () => {
          const RADIUS = undefined

          let nearestLocationKeyName

          before(async () => {
            nearestLocationKeyName = await LocationCache
              .getNearest(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            const locationKeyName = LocationCache
              .getLocationKeyName(nearestLocation)

            expect(nearestLocationKeyName).to.eql(locationKeyName)
          })
        })
      })

      context('when `latitude` is an `Array`', () => {
        let latitude

        before(() => {
          latitude = [ ...POSITIONS[0] ]
        })

        context('when `longitude` is a `Number`', () => {
          const LONGITUDE = 20

          let nearestLocationKeyName

          before(async () => {
            nearestLocationKeyName = await LocationCache
              .getNearest(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            const locationKeyName = LocationCache
              .getLocationKeyName(nearestLocation)

            expect(nearestLocationKeyName).to.eql(locationKeyName)
          })
        })

        context('when `longitude` is `undefined`', () => {
          const LONGITUDE = undefined

          let nearestLocationKeyName

          before(async () => {
            nearestLocationKeyName = await LocationCache
              .getNearest(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            const locationKeyName = LocationCache
              .getLocationKeyName(nearestLocation)

            expect(nearestLocationKeyName).to.eql(locationKeyName)
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

        location = await LocationCache
          .getNearest(position, radius)
      })

      it('should return `null`', () => {
        expect(location).to.not.exist
      })
    })
  })

  describe('.getNearestLocation', () => {
    const POSITIONS = [
      [ -8.00292, -34.8726 ],
      [ -8.00292, -34.8727 ],
      [ -8.00194, -34.8731 ],
      [ -8.00128, -34.8736 ]
    ]

    before(async () => {
      const promises = POSITIONS
        .map(p => {
          return LocationCache
            .set(p)
        })

      await Promise.all(promises)
    })

    after(async () => await redis.delAsync(LocationCache.LOCATION_KEY_NAME))

    context('when there is a near `location`', () => {
      let nearestLocation

      before(() => {
        nearestLocation = [ ...POSITIONS[0] ]
      })

      context('when `latitude` is a `Number`', () => {
        let latitude, longitude

        before(() => {
          latitude = nearestLocation[0]
          longitude = nearestLocation[1] + .00012
        })

        context('when `radius` is a `Number`', () => {
          const RADIUS = 20

          let nearestLocationCache

          before(async () => {
            nearestLocationCache = await LocationCache
              .getNearestLocation(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(nearestLocationCache).to.eql(nearestLocation)
          })
        })

        context('when `radius` is `undefined`', () => {
          const RADIUS = undefined

          let nearestLocationCache

          before(async () => {
            nearestLocationCache = await LocationCache
              .getNearestLocation(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(nearestLocationCache).to.eql(nearestLocation)
          })
        })
      })

      context('when `latitude` is an `Array`', () => {
        let latitude

        before(() => {
          latitude = [ ...POSITIONS[0] ]
        })

        context('when `longitude` is a `Number`', () => {
          const LONGITUDE = 20

          let nearestLocationCache

          before(async () => {
            nearestLocationCache = await LocationCache
              .getNearestLocation(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(nearestLocationCache).to.eql(nearestLocation)
          })
        })

        context('when `longitude` is `undefined`', () => {
          const LONGITUDE = undefined

          let nearestLocationCache

          before(async () => {
            nearestLocationCache = await LocationCache
              .getNearestLocation(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(nearestLocationCache).to.eql(nearestLocation)
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

        location = await LocationCache
          .getNearest(position, radius)
      })

      it('should return `null`', () => {
        expect(location).to.not.exist
      })
    })
  })

  describe('.set', () => {
    context('when `latitude` is not `null`', () => {
      context('when `latitude` is an `Array`', () => {
        const LOCATION = [ -8.15023, -34.84890 ]

        let status

        before(async () => {
          status = await LocationCache
            .set(LOCATION)
        })

        after(async () => await redis.delAsync(LocationCache.LOCATION_KEY_NAME))

        it('should return the `redis` status operation', () => {
          expect(status).to.exist
        })

        it('should save the `latitude` in `cache`', async () => {
          const locationCache = await LocationCache
            .getCache(LOCATION)

          expect(locationCache.map(l => parseFloat(parseFloat(l).toFixed(5)))).to.shallowDeepEqual(LOCATION)
        })
      })
    })

    context('when `latitude` is `null`', () => {
      let status

      before(async () => {
        status = await LocationCache
          .set(null)
      })

      it('should return `null`', () => {
        expect(status).to.not.exist
      })
    })
  })

  describe('.delete', () => {
    context('when `location` is cached', () => {
      const LOCATION = [ -8.00194, -34.8731 ]

      let locationCache

      before(async () => {
        await LocationCache
          .set(LOCATION)

        locationCache = await LocationCache
          .delete(LOCATION)
      })

      it('should delete the `cache`', async () => {
        const locationCacheTemp = await LocationCache
          .getCache(LOCATION)

        expect(locationCacheTemp).to.not.exist
      })

      it('should return the deleted `location`', () => {
        expect(locationCache.map(l => parseFloat(parseFloat(l).toFixed(5)))).to.shallowDeepEqual(LOCATION)
      })
    })

    context('when `location` is not cached', () => {
      const LOCATION = [ -12.78151, -32.5286 ]

      let locationCache

      before(async () => {
        locationCache = await LocationCache
          .delete(LOCATION)
      })

      it('should return `null`', () => {
        expect(locationCache).to.not.exist
      })
    })
  })
})