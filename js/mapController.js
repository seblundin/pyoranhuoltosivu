'use strict';

const map = L.map('mapid').setView([60.22, 24.92846], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: 'Map data from: &copy; <a href="https://osm.org/copyright">OpenStreetMap</a> and &copy; <a href="https://digitransit.fi">Helsinki Region Transport</a>',
}).addTo(map);
const routeGroup = L.layerGroup().addTo(map);
const allStationsGroup = L.layerGroup().addTo(map);

//viittaus nappiin
const nappi = document.getElementById('hakunappi');
const hakuelementti = document.getElementById('haku');

/*Reittihakuvalintaan kartan asettavan napin event listener*/
document.getElementById('reitti').addEventListener('click', event => {
      event.preventDefault();
      allStationsGroup.clearLayers();
      hakuelementti.style.display = 'block';
    },
);
/*Hakukentän nappi, joka käynnistää reittihaun.*/
nappi.addEventListener('click', planRoute);

/*Vuokrapyörälistaukseen kartan asettavan napin event listener*/
document.getElementById('kaikki').addEventListener('click', event => {
      event.preventDefault();
      routeGroup.clearLayers();
      hakuelementti.style.display = 'none';
      allBikes();
    },
);

/*Muuttujat käyttäjän sijainnille*/
let latitude = null;
let longitude = null;

/*funktio joka hakee käyttäjän sijainnin geolocation.getCurrentPosition avulla*/
function locateUser() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  }
}

/*Jos sijainnin haku onnistuu, siirrytään käyttäjän sijaintiin ja kirjataan se ylös.*/
function success(position) {
  latitude = position.coords.latitude;
  longitude = position.coords.longitude;
  map.flyTo(L.latLng(latitude, longitude), 14);
  //L.marker([latitude, longitude]).addTo(map).bindPopup('<b>Olet tässä<b/>');
}

/*Jos sijainnin haku ei onnistu pyydetään käyttäjää laittamaan sijainti päälle, jos sijaintidataa ei vielä ole saatavilla.*/
function error(error) {
  console.log(error);
  if (latitude === null || longitude === null) {
    alert(
        'Hyväksy sijainnin jakaminen, jos haluat käyttää reittihakupalvelua.');
  }
}

/*Haetaan hsl apista kaikki vuokrapyöräpysäkit pääkaupunkiseudulta. Jokainen pysäkki saa oman markerin, jossa on pysäkistä tietoa.*/
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


/*Reittihakufunktio, joka piirtää kartalle reitin käyttäjän sijainnista haettuun määränpäähän vuokrapyöräpysäkkien kautta.*/
function planRoute(evt) {
  evt.preventDefault();
  locateUser();

  //haetaan hakukohde elementistä
  const searchData = document.getElementById('paikkakunta').value;
  console.log(searchData);

  const apikey = 'bda75ef0309aec2639f2d2b9f73d35ab';
  //const apikey="6d8eb626a8e105e3350a67b724ae2e1a";

  const uri3 = 'https://api.openweathermap.org/data/2.5/weather?q=' +
      searchData + '&appid=' + apikey;
  const uri4 = 'https://nominatim.openstreetmap.org/?addressdetails=1&q=' + searchData + '&format=json&limit=1'

  /*Hakukohteen koordinaattien muuttujat*/
  let targetLat = null;
  let targetLon = null;

  /*apipyyntö openstreetmapille hakukohde sisältönään*/
  fetch(uri4)
      .then(vastaus => vastaus.json())
      .then(json => plotPath(json))
      .catch(error => console.log(error));

  /*Funktio, joka hakee hsl:ltä reittidatan käyttäjän ja määränpään koordinaattien välille ja piirtää sen avulla reitin karttaan*/
  function plotPath(json) {
    console.log(json);

    /*Asetetaan koordinaatit tavoitesijainnille*/
    targetLat = json[0].lat;
    targetLon = json[0].lon;

    /*Resetoidaan reittimerkinnät*/
    routeGroup.clearLayers();
    /*console.log(targetLat);
    console.log(targetLon);
    console.log(latitude);
    console.log(longitude);*/

    /*Apipyyntö hsl:lle. Sisältää paljon dataa jota ei lopuksi kuitenkaan käytetä.*/
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
      /*Jos hsl apilta tulee takaisin reitti, lähdetään sitä käsittelemään.*/
      if (!(res.data.plan.itineraries.length === 0)) {
        console.log(res);
        /*Jokaiselle saadulle etapille tehdään toimenpiteet.*/
        res.data.plan.itineraries[0].legs.forEach(leg => {
          console.log(leg);
          /*Kirjataan etapista dataa ylös markeria varten.*/
          let content = new Date(leg.startTime).toLocaleTimeString() +
              ' - ' + new Date(leg.endTime).toLocaleTimeString() + ':<br/>';
          content += leg.from.name;
          content += ' -> ';
          content += leg.to.name;

          /*Luodaan markerit etapin alkupisteelle ja määränpäälle.*/
          let marker1 = L.marker([leg.from.lat, leg.from.lon]);
          let marker2 = L.marker([leg.to.lat, leg.to.lon]);

          /*Tehdään tietynlainen sisältö markerille riippuen siitä, onko se pyöräasema vai ei.*/
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

          /*Piirretään viiva etapille saadun polyline datan avulla.*/
          let leg_polyline = L.polyline([],
              {
                color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                weight: 7,
              }).bindPopup(content).addTo(routeGroup);

          let points = polyline.decode(leg.legGeometry.points);
          for (let i = 0; i < points.length; i++) {
            leg_polyline.addLatLng(L.latLng(points[i][0], points[i][1]));
          }
        });
        /*Jos hsl api ei osaa tehdä reittiä koordinaattipisteiden välille, ilmoitetaan siitä käyttäjälle.*/
      } else {
        alert('HSL ei löytänyt reittiä.');
      }
    });
  }
}

