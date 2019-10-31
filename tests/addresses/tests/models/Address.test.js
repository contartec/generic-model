'use strict'

const Address = require('addresses/models/Address')

const AddressMock = require('addresses/tests/mocks/models/AddressMock')

describe('Address', () => {
  describe('#save', () => {
    context('when `address` is valid', () => {
      let address

      before(async () => {
        address = AddressMock.getMock()

        address = await address.save()
      })

      after(async () => await AddressMock.remove(address))

      it('should save the `address`', async () => {
        const addressTemp = await Address.findById(address._id)

        expect(addressTemp.id).to.exist
      })
    })

    context('when `address` is invalid', () => {
      let address, expectionFunction

      before(async () => {
        address = AddressMock
          .getMock({
            street_name: null
          })

        expectionFunction = async () => await address.save()
      })

      it('should return an `exception`', () => {
        return expect(expectionFunction()).to.be.rejectedWith(Error)
      })

      it('should not save the `address`', async () => {
        const addressTemp = await Address.findById(address.get('_id'))

        expect(addressTemp).to.not.exist
      })
    })
  })

  describe('#update', () => {
    context('when `address` is valid', () => {
      let address

      before(async () => {
        address = await AddressMock.add()
        address = await Address.findById(address._id)

        address.street_name = 'arpel 4595'

        await address.save()
      })

      after(async () => await AddressMock.remove(address))

      it('should update the `address`', async () => {
        const addressTemp = await Address
          .findById(address._id)

        expect(addressTemp.street_name).to.eql(address.street_name)
      })
    })

    context('when `address` is invalid', () => {
      let address, expectionFunction

      before(async () => {
        address = await AddressMock.add()
        address = await Address.findById(address._id)

        address.street_name = null

        expectionFunction = async () => await address.save()
      })

      after(async () => await Address.findByIdAndRemove(address._id))

      it('should return an `exception`', () => {
        return expect(expectionFunction()).to.be.rejectedWith(Error)
      })

      it('should not update the `address`', async () => {
        const addressTemp = await Address.findById(address.get('_id'))

        expect(addressTemp.street_name).to.not.eql(address.street_name)
      })
    })
  })

  describe('#setLocation', () => {
    context('when address has `geometry` attr', () => {
      const LOCATION = [ -8.00194, -34.8731 ]
      
      let address

      before(() => {
        address = new Address({
          geometry: {
            location: {
              lat: LOCATION[0],
              lng: LOCATION[1]
            }
          }
        })

        address.setLocation()
      })

      it('should set `location` with same value as `geometry.location`', () => {
        expect(address.location).to.eql(LOCATION)
      })
    })

    context('when address has no `geometry` attr', () => {
      let address

      before(() => {
        address = new Address()

        address.setLocation()
      })

      it('should not set `location`', () => {
        expect(address.location).to.not.exist
      })
    })
  })

  describe('#setIsBusStation', () => {
    context('when `address` is a `bus station`', () => {
      const ADDRESS_BUS_STATION_TYPES = ['bus_station', 'transit_station']

      ADDRESS_BUS_STATION_TYPES
        .forEach(TYPE => {
          context('when `address.types` has `${TYPE}`', () => {
            let address

            before(() => {
              address = AddressMock
                .getMock({
                  types: ['bla', 'la', 'arpel', TYPE]
                })

              address.setIsBusStation()
            })

            it('should return `true`', () => {
              expect(address.is_bus_station).to.true
            })
          })
        })
    })

    context('when `address` is not a `bus station`', () => {
      let address

      before(() => {
        address = AddressMock
          .getMock({
            types: ['bla', 'la', 'arpel']
          })

        address.setIsBusStation()
      })

      it('should return `false`', () => {
        expect(address.is_bus_station).to.false
      })
    })
  })

  describe('.getAll', () => {
    context('when filtered by `country_short`', () => {
      const COUNTRY_SHORT = 'BR'

      let DEFAULT_PARAMS, addresses

      before(async () => {
        addresses = await AddressMock
          .addMocks({
            country_short: COUNTRY_SHORT
          })

        addresses = await Address
          .find(DEFAULT_PARAMS)

        DEFAULT_PARAMS = { 
          country_short: COUNTRY_SHORT
        }
      })

      after(async () => await AddressMock.remove(addresses))

      it('should return the `address`', async () => {
        const params = { ...DEFAULT_PARAMS }

        const addressesTemp = await Address
          .getAll(params)

        const addresses = await Address
          .find(params)
          .sort('date')

        expect(JSON.parse(JSON.stringify(addressesTemp))).to.deep.equal(JSON.parse(JSON.stringify(addresses)))
      })

      context('and pageSize is `2`', () => {
        const PAGE_SIZE = 2

        before(async () => {
          const params = { ...DEFAULT_PARAMS, pageSize: 2 }

          addresses = await Address
            .getAll(params)
        })

        it('should return a list of `pageSize`\'s length', async () => {
          const addressesTemp = await Address
            .find(DEFAULT_PARAMS)

          expect(addresses).to.have.lengthOf(PAGE_SIZE)
          expect(JSON.parse(JSON.stringify(addresses))).to.deep.equal(JSON.parse(JSON.stringify(addressesTemp.slice(0, 2))))
        })
      })

      context('and page is 2', () => {
        it('should return the addresses of page 2', async () => {
          const params = { ...DEFAULT_PARAMS, page: 2 }

          const addressesTemp = await Address
            .getAll(params)

          expect(addressesTemp).to.have.lengthOf(0)
        })
      })
    })
  })

  describe('.getCount', () => {
    context('when filtered by `country_short`', () => {
      const COUNTRY_SHORT = 'BR'

      let addresses, DEFAULT_PARAMS

      before(async () => {
        addresses = await AddressMock
          .addMocks({
            country_short: COUNTRY_SHORT
          })

        DEFAULT_PARAMS = { 
          counttry: COUNTRY_SHORT
        }
      })

      after(async () => await AddressMock.remove(addresses))

      it('should return the count of `addresses`', async () => {
        const params = { ...DEFAULT_PARAMS }

        const countAddresssTemp = await Address
          .getCount(params)

        const countAddresss = await Address
          .count(params)

        expect(countAddresssTemp).to.eql(countAddresss)
      })
    })
  })

  describe('.getOne', () => {
    context('when filtered by `country_short`', () => {
      const COUNTRY_SHORT = 'BR'

      let addresses, DEFAULT_PARAMS

      before(async () => {
        addresses = await AddressMock
          .addMocks({
            country_short: COUNTRY_SHORT
          })

        DEFAULT_PARAMS = { 
          country_short: COUNTRY_SHORT
        }
      })

      after(async () => await AddressMock.remove(addresses))

      it('should return the `address`', async () => {
        const params = { ...DEFAULT_PARAMS, id: addresses[0].id }

        const addressGetOne = await Address
          .getOne(params)

        const addressGetOneQuery = await Address
          .findOne(params)

        expect(addressGetOne).to.deep.equal(addressGetOneQuery)
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

    let addresses

    before(async () => {
      const promises = POSITIONS
        .map(p => {
          return AddressMock
            .add({
              location: p
            })
        })

      addresses = await Promise.all(promises)
    })

    after(async () => await AddressMock.remove(addresses))

    context('when there is a near `address`', () => {
      let nearestAddress, position

      before(() => {
        nearestAddress = addresses[0]
        position = [ ...nearestAddress.location ]
      })

      context('when `latitude` is a `Number`', () => {
        let latitude, longitude

        before(() => {
          latitude = position[0]
          longitude = position[1]
        })

        context('when `radius` is a `Number`', () => {
          const RADIUS = 20

          let address

          before(async () => {
            address = await Address
              .getNearest(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(address.toJSON()).to.shallowDeepEqual(nearestAddress.toJSON())
          })
        })

        context('when `radius` is `undefined`', () => {
          const RADIUS = undefined

          let address

          before(async () => {
            address = await Address
              .getNearest(latitude, longitude, RADIUS)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(address.toJSON()).to.shallowDeepEqual(nearestAddress.toJSON())
          })
        })
      })

      context('when `latitude` is an `Array`', () => {
        let latitude

        before(() => {
          latitude = [ ...position ]
        })

        context('when `longitude` is a `Number`', () => {
          const LONGITUDE = 20

          let address

          before(async () => {
            address = await Address
              .getNearest(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(address.toJSON()).to.shallowDeepEqual(nearestAddress.toJSON())
          })
        })

        context('when `longitude` is `undefined`', () => {
          const LONGITUDE = undefined

          let address

          before(async () => {
            address = await Address
              .getNearest(latitude, LONGITUDE)
          })

          it('should return the `nearest` `adrress`', () => {
            expect(address.toJSON()).to.shallowDeepEqual(nearestAddress.toJSON())
          })
        })
      })
    })

    context('when there is no near `address`', () => {
      let address

      before(async () => {
        const position = [ ...POSITIONS[0] ]
        const radius = 20

        position[0] += .1334

        address = await Address
          .getNearest(position, radius)
      })

      it('should return `null`', () => {
        expect(address).to.not.exist
      })
    })
  })

  describe('.saveOrUpdate', () => {
    context('when `address` is valid', () => {
      let address

      before(async () => {
        address = await Address
          .saveOrUpdate(AddressMock.getMock())
      })

      after(async () => await AddressMock.remove(address))

      it('should save the `address`', async () => {
        const addressTemp = await Address.findById(address.get('_id'))

        expect(addressTemp.get('_id')).to.exist
      })
    })

    context('when `address` is invalid', () => {
      let address, expectionFunction

      before(async () => {
        address = AddressMock
          .getMock({
            street_name: null
          })

        expectionFunction = async () => address = await Address.saveOrUpdate(address)
      })

      it('should return an `exception`', () => {
        return expect(expectionFunction()).to.be.rejectedWith(Error)
      })

      it('should not save the `address`', async () => {
        const addressTemp = await Address.findById(address.get('_id'))

        expect(addressTemp).to.not.exist
      })
    })
  })

  describe('.isBusStation', () => {
    context('when `address` is a `bus station`', () => {
      const ADDRESS_BUS_STATION_TYPES = ['bus_station', 'transit_station']

      ADDRESS_BUS_STATION_TYPES
        .forEach(TYPE => {
          context('when `address.types` has `${TYPE}`', () => {
            let address

            before(() => {
              address = AddressMock
                .getMock({
                  types: ['bla', 'la', 'arpel', TYPE]
                })
            })

            it('should return `true`', () => {
              const isBusStation = Address.isBusStation(address)

              expect(isBusStation).to.true
            })
          })
        })
    })

    context('when `address` is not a `bus station`', () => {
      let address

      before(() => {
        address = AddressMock
          .getMock({
            types: ['bla', 'la', 'arpel']
          })
      })

      it('should return `false`', () => {
        const isBusStation = Address.isBusStation(address)

        expect(isBusStation).to.false
      })
    })
  })
})