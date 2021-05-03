'use strict';

var map = L.map('mapid').setView([60.22, 24.92846], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
var routeGroup = L.layerGroup().addTo(map);

//viittaus nappiin
const nappi = document.getElementById('hakunappi');
nappi.addEventListener('click', haeTiedot);

let latitude = null;
let longitude = null;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  map.flyTo(L.latLng(latitude, longitude), 14);
  //L.marker([latitude, longitude]).addTo(map).bindPopup('<b>Olet tässä<b/>');
}

function error(error) {
  console.log(error);
}

/*graphql request for stop data*/
/*fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    query: `
    {
      bikeRentalStations {
        name
        stationId
        bikesAvailable
        spacesAvailable
        lat
        lon
      }
    }`,
  }),
}).then(res => res.json()).then(res => {
  //console.log(res.data.bikeRentalStations);
  res.data.bikeRentalStations.forEach(station => {
    //console.log(station.lon, station.lat);
    L.marker([station.lat, station.lon]).
        addTo(map).
        bindPopup(
            `Name: ${station.name}, available: ${station.bikesAvailable}`);
  });
});*/

//L.marker([60.22, 24.92846]).addTo(map);

function haeTiedot(evt) {
  evt.preventDefault();

  //haetaan paikkakunta elementistä
  const paikkakunta = document.getElementById('paikkakunta').value;
  console.log(paikkakunta);

  const apikey = 'bda75ef0309aec2639f2d2b9f73d35ab';
  //const apikey="6d8eb626a8e105e3350a67b724ae2e1a";

  const uri3 = 'https://api.openweathermap.org/data/2.5/weather?q=' +
      paikkakunta + '&appid=' + apikey;

  let targetLat = null;
  let targetLon = null;

  fetch(uri3)
      //kun saadaan vastaus kutsutaan json metodia mikä tekee siitä javascriptin tietorakenteen
      .then(vastaus => vastaus.json())
      //kun saadaan json metodin palauttama javascript oli, annetaan se parametrina metodille showResult
      .then(json => naytaTulos2(json)).catch(error => console.log(error));

  function naytaTulos2(json) {
    //console.log(json);
    if (json.cod === 200) {

      /*Asetetaan koordinaatit tavoitesijainnille*/
      targetLat = json.coord.lat;
      targetLon = json.coord.lon;

      /*Resetoidaan reittimerkinnät*/
      routeGroup.clearLayers();

      //map.flyTo(L.latLng(lat, lon), 14);

      /*Apipyyntö */
      fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          query: `
      {
        plan(
          from: {lat: ${latitude}, lon: ${longitude}},
          to: {lat: ${targetLat}, lon: ${targetLon}},
          numItineraries: 1,
          transportModes: [{mode: BICYCLE, qualifier: RENT}, {mode: WALK}]
        ) {
          itineraries{
            walkDistance
            duration
            legs {
              mode
              startTime
              endTime
              from {
                lat
                lon
                name
                bikeRentalStation {
                  stationId
                  name
                  bikesAvailable
                }
              }
              to {
                lat
                lon
                name
                bikeRentalStation {
                  stationId
                  name
                  bikesAvailable
                }
              }
              distance
              legGeometry {
                length
                points
              }
            }
          }
        }
      }`,
        }),
      }).then(res => res.json()).then(res => {
        //console.log(res);
        res.data.plan.itineraries[0].legs.forEach(leg => {
          console.log(leg);
          let content = new Date(leg.startTime).toLocaleTimeString() +
              ' - ' + new Date(leg.endTime).toLocaleTimeString() + ':<br/>';
          content += leg.from.name;
          content += ' -> ';
          content += leg.to.name;

          if (leg.mode === 'WALK') {
            if (leg.from.name === 'Origin') {
              L.marker([leg.from.lat, leg.from.lon]).
                  bindPopup('<b>Lähtöpiste</b>').
                  addTo(routeGroup).openPopup();
            } else {
              L.marker([leg.to.lat, leg.to.lon]).
                  bindPopup(`<b>${leg.to.name}</b>`).
                  addTo(routeGroup);
            }

          } else {
            L.marker([leg.from.lat, leg.from.lon]).
                bindPopup(
                    `<b>${leg.from.name}</b><br/>(Kaupunkipyöräasema)<br/>Pyöriä: ${leg.from.bikeRentalStation.bikesAvailable}`).
                addTo(routeGroup);
            L.marker([leg.to.lat, leg.to.lon]).
                bindPopup(
                    `<b>${leg.to.name}</b><br/>(Kaupunkipyöräasema)<br/>Pyöriä: ${leg.to.bikeRentalStation.bikesAvailable}`).
                addTo(routeGroup);
          }

          let leg_polyline = L.polyline([],
              {
                color: '#FF0000',
                weight: 7,
              }).bindPopup(content).addTo(routeGroup);

          let points = polyline.decode(leg.legGeometry.points);
          for (let i = 0; i < points.length; i++) {
            leg_polyline.addLatLng(L.latLng(points[i][0], points[i][1]));
          }
        });
      });
    } else {
      document.getElementById('tulos').innerText = 'Haku epäonnistui.';
    }
  }

  /*L.Routing.control({
    waypoints: [
      L.latLng(latitude, longitude),
      L.latLng(targetLat, targetLon),
    ],
  }).addTo(map);*/

  //console.log(paikkakunta + " toimiiko");

  //console.log(uri);

}

