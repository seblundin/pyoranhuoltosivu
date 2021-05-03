'use strict';

var map = L.map('mapid').setView([60.22, 24.92846], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: 'Map data from: &copy; <a href="https://osm.org/copyright">OpenStreetMap</a> and &copy; <a href="https://digitransit.fi">Helsinki Region Transport</a>',
}).addTo(map);
const routeGroup = L.layerGroup().addTo(map);
const allStationsGroup = L.layerGroup().addTo(map);

//viittaus nappiin
const nappi = document.getElementById('hakunappi');
const hakuelementti = document.getElementById('haku');
nappi.addEventListener('click', haeTiedot);

/*Reittihakuvalintaan kartan asettavan radiobuttonin event listener*/
document.getElementById('reitti').addEventListener('click', event => {
      event.preventDefault();
      allStationsGroup.clearLayers();
      hakuelementti.style.display = 'block';
    },
);

/*Vuokrapyörälistaukseen kartan asettavan radiobuttonin event listener*/
document.getElementById('kaikki').addEventListener('click', event => {
      event.preventDefault();
      routeGroup.clearLayers();
      hakuelementti.style.display = 'none';
      allBikes();
    },
);

let latitude = null;
let longitude = null;
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

function success(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  map.flyTo(L.latLng(latitude, longitude), 14);
  //L.marker([latitude, longitude]).addTo(map).bindPopup('<b>Olet tässä<b/>');
}

function error(error) {
  console.log(error);
  if (latitude === null || longitude === null) {
    alert('Hyväksy sijainnin jakaminen, jos haluat käyttää reittihakupalvelua.');
  }
}

/*graphql request for stop data*/
function allBikes() {
  fetch('https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql', {
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
          addTo(allStationsGroup).
          bindPopup(
              `<b>${station.name}</b><br/>Pyöriä: ${station.bikesAvailable}`);
    });
  });
  //L.marker([60.22, 24.92846]).addTo(map);
}

function haeTiedot(evt) {
  evt.preventDefault();
  locateUser();

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
        res.data.plan.itineraries[0].legs.forEach(leg => {
          console.log(leg);
          let content = new Date(leg.startTime).toLocaleTimeString() +
              ' - ' + new Date(leg.endTime).toLocaleTimeString() + ':<br/>';
          content += leg.from.name;
          content += ' -> ';
          content += leg.to.name;

          let marker1 = L.marker([leg.from.lat, leg.from.lon]);
          let marker2 = L.marker([leg.to.lat, leg.to.lon]);

          if (!(leg.from.bikeRentalStation === null)) {
            marker1.
                bindPopup(
                    `<b>${leg.from.name}</b><br/>Kaupunkipyöräasema<br/>Pyöriä: ${leg.from.bikeRentalStation.bikesAvailable}`).
                addTo(routeGroup);
          } else {
            marker1.
                bindPopup(
                    `<b>${leg.from.name}</b>`).
                addTo(routeGroup);
          }
          if (!(leg.to.bikeRentalStation === null)) {
            marker2.
                bindPopup(
                    `<b>${leg.to.name}</b><br/>Kaupunkipyöräasema<br/>Pyöriä: ${leg.to.bikeRentalStation.bikesAvailable}`).
                addTo(routeGroup);
          } else {
            marker2.
                bindPopup(
                    `<b>${leg.to.name}</b>`).
                addTo(routeGroup);
          }


          let leg_polyline = L.polyline([],
              {
                color: '#' + Math.floor(Math.random()*16777215).toString(16),
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
}

