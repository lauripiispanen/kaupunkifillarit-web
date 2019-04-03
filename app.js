const express = require('express')
const compress = require('compression')
const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport
const helmet = require('helmet')
const fetch = require('node-fetch')

const app = express()
const HSL_GRAPHQL_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql'
const FOLI_REST_URL = 'https://data.foli.fi/citybike'
const graphQLClient = new Lokka({
  transport: new Transport(HSL_GRAPHQL_URL)
})

let stationCaches = {}

app.use(compress())
app.use(helmet())
app.use(express.static('./public', {maxAge: 30 * 60 * 1000}))

app.get('/api/stations', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=5')
  res.json({
    bikeRentalStations: Object.values(stationCaches).flatMap(cache => cache.bikeRentalStations)
  })
})

function refreshStationCacheFoli() {
  fetch(FOLI_REST_URL)
    .then(res => res.json())
    .then(data => Object.values(data.racks))
    .then(racks => ({
        bikeRentalStations: racks.map(rack => ({
          id: rack.id,
          name: rack.name,
          lat: rack.lat,
          lon: rack.lon,
          bikesAvailable: rack.bikes_avail,
          spacesAvailable: rack.slots_avail
        }))
      })
    ).then(result => {
      stationCaches.foli = result
    })
}

function refreshStationCacheHSL() {
  graphQLClient.query(`
    {
      bikeRentalStations {
        id,
        name,
        lat,
        lon,
        bikesAvailable,
        spacesAvailable,
        state
      }
    }
  `).then(result => {
    stationCaches.hsl = result.bikeRentalStations
      .map(station => {
        station.active = station.state === 'Station off' ? false : true
        return station
      })
      .filter(station => station.active)
  })
}

function refreshStationCaches() {
  refreshStationCacheFoli()
  refreshStationCacheHSL()
}

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Kaupunkifillarit.fi listening on *:${port}`)
  setInterval(refreshStationCaches, 5 * 1000)
  refreshStationCaches()
})

