// Utilidades
// Node Selector based in JQuery
window.$ = function(selector = document.body){
  let result;

  selector = (typeof selector !== "undefined") ? selector : document.body; // Set default value for selector

  // If using css selectors
  if(typeof selector === "string"){
    let elements = Array.from(document.querySelectorAll(selector));
    result = (elements.length === 1) ? elements[0] : elements;
  }else if(Object.is(selector, document) || Object.is(selector, window)){
    result = selector;
  }else{
    throw new TypeError('Selector argument is not valid');
  }

  if(Array.isArray(result)){
    if(result.length === 0) return null;
  }

  return result;
};

// shorthand to addEventListener
window.Node.prototype.on = function(eventType, callback){
  if(eventType === undefined || typeof eventType !== "string") return;
  if(callback === undefined || typeof callback !== "function") return;

  this.addEventListener(`${eventType}`, callback);
  return this;
};
window.on = window.Node.prototype.on;

// shorthand to style.[propertyName] and modify styles
window.Node.prototype.css = function(arg){
  if(Object.prototype.toString.call(arg) === '[object Array]'){
    let result = [];

    for(let i=0; i<arg.length; i++){
        let value = this.style[arg[i]];

        value = (value !== '') ? value : window.getComputedStyle(this).getPropertyValue(arg[i]);

      result.push(value);
    }

    return (result.length === 1) ? result[0] : result;
  }

  if(arguments.length === 1){
    let data = arguments[0];

    if(data === Object(data)){
      let keys = Object.keys(data);

      for(let i=0; i<keys.length; i++){
        this.style[keys[i]] = data[keys[i]];
      }
    }else if(typeof data === "string"){
      let value = this.style[data];

        value = (value !== '') ? value : window.getComputedStyle(this).getPropertyValue(data);

      return value;
    }

  }else if(arguments.length === 2){
    let property = arguments[0],
      value = arguments[1];

    if(typeof property === "string" && ["string", "number"].includes(typeof value)){
      this.style[arguments[0]] = arguments[1];
    }
  }

  return this;
};
document.body.css = window.Node.prototype.css;

// Prototipo de la función shuffle para crear el arreglo aleatorio de las canciones
Array.prototype.shuffle = function() {
    let i = this.length, j, temp;

    // si no hay elementos en el arreglo, se termina la función
    if (i == 0) return this;

    for (i = i - 1; i > 0; i--) {
        j = Math.floor( Math.random() * (i + 1) );
        temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }

    return this;
}
Array.prototype.sattolo = function() {
    const len = this.length;

    for (let i = 0; i < len - 1; i++) { // 0 to n -1, exclusive because the last item doesn't need swapping
        let j = Math.floor(Math.random() * (len-(i+1)))+(i+1); // i+1 to len, exclusive
        const temp = this[i];
        this[i] = this[j];
        this[j] = temp;
    }
    
    return this;
}
Array.prototype.copy = function() {
    return Array.from(this);
}
Array.prototype.equalsTo = function(array) {
    if (this.length !== array.length) return false;

    for (let i = 0; i < this.length; i++) {
        if (this[i] !== array[i]) return false;
    }

    return true;
}

// Declaraciones
const titleImage = $('#title-image'),
    titleText = $('#title-text'),
    sloganImage = $('#slogan-image'),
    sloganText = $('#slogan-text'),
    rollerLeft = $('#roller-left'),
    rollerRight = $('#roller-right'),
    btnPlay = $('#btn-play'),
    btnPause = $('#btn-pause'),
    btnBack = $('#btn-back'),
    btnForward = $('#btn-forward'),
    btnStop = $('#btn-stop'),
    progressValue = $('#progress-song-value'),
    progressBar = $('#progress-bar'),
    currentTimeIndicator = $('#current-time'),
    lastTimeIndicator = $('#last-time');

// Variables de utilidad
let currentSong = { index: -1, path: '' },
    player = null,
    oldShuffleSongs = new Array(),
    isStarted = false,
    isLoaded= false,
    currentTime = 0,
    acumulateTime = 0,
    currentTimeInterval = null,
    songIndex = 0;

// Arreglo con la lista de las canciones
const SONGS = new Array(
    {path: "https://vk.com/doc297826490_503417139", artist: "Nacho", song: "Bailame", duration: "03:27"},
    {path: "./canciones/010.txt", artist: "Nacho", song: "Bailame", duration: "04:39"},
    {path: "./canciones/011.json", artist: "Nacho", song: "Bailame", duration: "04:47"},
    {path: "./canciones/011.mp3", artist: "Nacho", song: "Bailame", duration: "04:09"},
    {path: "./canciones/012.mp3", artist: "Chino y Nacho ft. Daddy Yankee", song: "Andas en mi cabeza", duration: "04:26"},
    {path: "./canciones/013.mp3", artist: "Danny Ocean", song: "Me rehuso", duration: "03:43"},
    {path: "./canciones/014.mp3", artist: "Danny Ocean", song: "Dembow", duration: "04:23"},
    {path: "./canciones/015.mp3", artist: "Danny Ocean", song: "Vuelve", duration: "03:39"},
    {path: "https://vk.com/doc297826490_516662404", type:"mp3", artist: "Nacho", song: "Bailame", duration: "55:37"},
    {path: "https://drive.google.com/uc?export=download&id=1-HRTK8iCj9PZyNmw-RId10BotJuEoI15", type:"mp3", artist: "Nacho", song: "Bailame", duration: "01:52:34"}
 );

 // Tipo de reproductor, dos opciones: 'playlist' o 'stream'
const ReproductorTipo = {
        get Playlist(){ return 1; },
        get Stream(){ return 2; }
    },
    // Configuración del tipo de reproducción
    EstiloReproduccion = {
        get Linear(){ return 1; }, // Reproducir de inicio a fin
        get LinearLoop(){ return 2; }, // Reproducir de inico a fin y repetir
        get Shuffle(){ return 3; }, // Reproducir revolviendo la lista
        get Sattolo(){ return 4; } // Reproducir revolviendo con Sattolo
    },
    // Tipo de visualización del tiempo final de la reproducción
    TiempoFinal = {
        get TiempoTotal(){ return 1; }, // Muestra el tiempo total de reproducción
        get TiempoRestante(){ return 2; } // Muestra el tiempo restante de la reproducción
    };

const RadioCassette = {
    reproductorTipo: 1, // Tipo de reproductor 1=lista, 2=radio
    canciones: SONGS, // Lista de canciones a reproducir para la opción 1 de 'reproductorTipo' o la dirección para la opción 2 de 'reproductorTipo'
    url: 'https://icecast.teveo.cu/b3jbfThq',//'http://198.27.83.198:5140/stream', // URL de la radio
    mostrarTiempoGeneral: 0, // Mostrar tiempo general de la reproducción, 1=sí, 0=no
    valorTiempoGeneral: "01:01:00", // Tiempo de duración en segundos para el tipo de reproducción general, 1 hora = 3600 segundos
    estiloReproduccion: 1, // Tipo de reproducción 1=inicio a fin, 2=inicio a fin y repetir, 3=revolver lista, 4=sattolo
    tiempoFinal: 1, // Tipo de tiempo final 1=timepo total, 2=tiempo restante
    imagenTitulo: '', // url de la imagen a mostrar detrás del texto del título de la emisora
    textoTitulo: '', // Texto a mostrar como título de la emisora
    imagenEslogan: '', // url de la imagen a mostrar detrás del texto del eslogan de la emisora
    textoEslogan: '', // Texto a mostrar como eslogan de la emisora
};

window.on('load', () => {
});