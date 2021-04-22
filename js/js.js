const navElement = document.getElementById('nav');
const navChildren = navElement.children;
const palikat = document.getElementsByClassName('palikka');
const ham = document.getElementById('ham');


/*Annetaan mobiilinäkymän navigointipalkin checkboxille tapahtumankuuntelija,
* joka määrittää näkyykö valikon sisältöä vai ei.*/
ham.addEventListener('click', function() {
  if (ham.checked === false) {
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
      case 'l_1': document.getElementById('main').style.display = 'block';
      break;
      case 'l_2': document.getElementById('huolto').style.display = 'block';
      break;
      case 'l_3': document.getElementById('liikkeet').style.display = 'block';
      break;
      case 'l_4': document.getElementById('vuokra').style.display = 'block';
    }
  });
}

/*Varmistetaan, että navigointipalkin elementit pysyvät näkyvissä mobiilinäkymästä poistuttaessa.*/
window.addEventListener("resize", function(evt) {
  evt.preventDefault();
  //Jos ikkunan koko on suurempi kuin 600px ja naviogintipalkkia ei ole näkyvissä, otetaan se näkyviin.
  if (document.documentElement.clientWidth > 600 && navElement.style.display === 'none') {
    navElement.style.display = 'block';
    //Resetoidaan checkboxin arvo.
    ham.checked = false;
  }
});