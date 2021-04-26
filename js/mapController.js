'use strict';

var map = L.map('mapid').setView([60.22, 24.92846], 11);
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

//viittaus nappiin
const nappi = document.getElementById('hakunappi');
nappi.addEventListener('click',haeTiedot);

/*graphql request for stop data*/
let stations;
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
  stations = res.data.bikeRentalStations;
  res.data.bikeRentalStations.forEach(station => {
    //console.log(station.lon, station.lat);
    L.marker([station.lat, station.lon]).addTo(map)
    .bindPopup(`Name: ${station.name}, available: ${station.bikesAvailable}`);
  });
});

//L.marker([60.22, 24.92846]).addTo(map);



function haeTiedot(evt) {
  //alert("toimiiko");

  //kytketään oletustapahtumankäsittelijät pois päältä
  evt.preventDefault();

  //haetaan paikkakunta elementistä
  const paikkakunta = document.getElementById("paikkakunta").value;

  //console.log(paikkakunta + " toimiiko");

  const apikey="bda75ef0309aec2639f2d2b9f73d35ab";
  //const apikey="6d8eb626a8e105e3350a67b724ae2e1a";

  const uri3 = "https://api.openweathermap.org/data/2.5/weather?q=" + paikkakunta + "&appid=" + apikey;

  //console.log(uri);


  fetch(uri3)
      //kun saadaan vastaus kutsutaan json metodia mikä tekee siitä javascriptin tietorakenteen
      .then(vastaus => vastaus.json())
      //kun saadaan json metodin palauttama javascript oli, annetaan se parametrina metodille showResult
      .then(json => naytaTulos2(json))
      .catch(error => console.log(error));


  function naytaTulos2(json) {
    console.log(json);
    if (json.cod === 200) {
      //alert("OK vastaus");
      //const paikka = json.name;
      //const kelvin = json.main.temp;
      //const kelvinToCelscius = (temp) => (temp-273.15).toFixed(1);
      //const celsius = kelvinToCelscius(kelvin);
      //console.log(kelvin);

      //document.getElementById("tulos").innerText = paikka + ": " + celsius + " astetta.";

      const lat = json.coord.lat;
      const lon = json.coord.lon;

      map.flyTo(L.latLng(lat,lon), 14);


    } else {
      document.getElementById("tulos").innerText = "Haku epäonnistui.";
    }
  }

}

