'use strict';

const navElement = document.getElementById('nav');
const navChildren = navElement.children;
const palikat = document.getElementsByClassName('palikka');
const ham = document.getElementById('ham');

/*Annetaan mobiilinäkymän navigointipalkin checkboxille tapahtumankuuntelija,
* joka määrittää näkyykö valikon sisältöä vai ei.*/
ham.addEventListener('click', function() {
  console.log(ham.checked);
  if (ham.checked === true) {
    navElement.style.display = 'block';
  } else {
    navElement.style.display = 'none';
  }
});

/*Lisätään tapahtumankuuntelija jokaiselle navigointipalkin li elementille*/
for (let navChild of navChildren) {
  navChild.addEventListener('click', function(evt) {
    evt.preventDefault();
    /*Piilotetaan kaikki sivuston div elementit joissa on pääsisältö.*/
    for (let palikatElement of palikat) {
      palikatElement.style.display = 'none';
    }
    /*Otetaan klikkausta vastaava div elementti esiin.*/
    switch (navChild.id) {
      case 'l_1':
        document.getElementById('main').style.display = 'flex';
        break;
      case 'l_2':
        document.getElementById('huolto').style.display = 'flex';
        break;
      case 'l_3':
        document.getElementById('liikkeet').style.display = 'flex';
        break;
      case 'l_4':
        document.getElementById('vuokra').style.display = 'flex';
    }
  });
}

/*Varmistetaan, että navigointipalkin elementit pysyvät näkyvissä mobiilinäkymästä poistuttaessa.*/
window.addEventListener('resize', function(evt) {
  evt.preventDefault();
  let currentWidth = document.documentElement.clientWidth;
  if (currentWidth > 600) {
    navElement.style.display = 'block';
    ham.checked = false;
  } else {
    navElement.style.display = 'none';
  }
});
