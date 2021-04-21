const navChildren = document.getElementById('nav').children;
const palikat = document.getElementsByClassName('palikka');






for (let navChild of navChildren) {
  navChild.addEventListener('click', function(evt) {
    for (let palikatElement of palikat) {
      palikatElement.style.display = 'none';
    }
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
