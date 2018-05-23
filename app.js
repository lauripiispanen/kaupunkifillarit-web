const _ = require('lodash')
const express = require('express')
const compress = require('compression')
const Lokka = require('lokka').Lokka
const Transport = require('lokka-transport-http').Transport
const helmet = require('helmet')

var stationCache = null

const app = express()
const HSL_GRAPHQL_URL = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql'
const graphQLClient = new Lokka({
  transport: new Transport(HSL_GRAPHQL_URL)
})

app.use(compress())
app.use(helmet())
app.use(express.static('./public', {maxAge: 30 * 60 * 1000}))

app.get('/api/stations', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=5')
  res.json(stationCache)
})

function refreshStationCache() {
  graphQLClient.query(`
    {
      bikeRentalStations {
        id,
        name,
        lat,
        lon,
        bikesAvailable,
        spacesAvailable
      }
    }
  `).then(result => {
    stationCache = result
  })
}

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Kaupunkifillarit.fi listening on *:${port}`)
  setInterval(refreshStationCache, 5 * 1000)
  refreshStationCache()
})

