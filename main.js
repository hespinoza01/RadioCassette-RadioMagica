// Utilidades
// Selector de elementos html inspirado en JQuery
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

// acortador a la funcción addEventListener
window.Node.prototype.on = function(eventType, callback){
  if(eventType === undefined || typeof eventType !== "string") return;
  if(callback === undefined || typeof callback !== "function") return;

  this.addEventListener(`${eventType}`, callback);
  return this;
};
window.on = window.Node.prototype.on;

// acortador para el  style.[propertyName] y así modificar los estilos de los elementos
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

String.prototype.numberFromPx = function(){
    return Number(this.split('px').join(''));
}

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

const root = document.documentElement;

root.set = function(_property, _value) {
    this.style.setProperty(`--${_property}`, _value);
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
    lastTimeIndicator = $('#last-time'),
    headbandContainer = $('#headband-container'),
    headband = $('#headband');

// Variables de utilidad
let currentSong = { index: -1, path: '' },
    player = null,
    oldShuffleSongs = new Array(),
    isStarted = false,
    isLoaded= false,
    currentTime = 0,
    acumulateTime = 0,
    currentTimeInterval = null,
    reverseInterval = null,
    songIndex = 0,
    rollerLeftShadow = getShadowTam(),
    rollerRightShadow = 0,
    headbandShadowProportion = 0,
    oldShadowTam = 0,
    isReverse = false,
    totalOffset = 0;

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
    mostrarTiempoGeneral: 1, // Mostrar tiempo general de la reproducción, 1=sí, 0=no
    valorTiempoGeneral: "01:01:10", // Tiempo de duración en segundos para el tipo de reproducción general, 1 hora = 3600 segundos
    estiloReproduccion: 1, // Tipo de reproducción 1=inicio a fin, 2=inicio a fin y repetir, 3=revolver lista, 4=sattolo
    tiempoFinal: 1, // Tipo de tiempo final 1=timepo total, 2=tiempo restante
    imagenTitulo: 'https://i.pinimg.com/originals/83/81/17/8381171693f7fedc6b6411c39f15f9fb.jpg', // url de la imagen a mostrar detrás del texto del título de la emisora
    textoTitulo: 'Radio Maracaibo', // Texto a mostrar como título de la emisora
    imagenEslogan: 'https://i.pinimg.com/originals/83/81/17/8381171693f7fedc6b6411c39f15f9fb.jpg', // url de la imagen a mostrar detrás del texto del eslogan de la emisora
    textoEslogan: 'la radio alegre', // Texto a mostrar como eslogan de la emisora
    colorCinta: '#713308', // Valor del color de la cinta en hexadecimal
    colorCintaVacia1: '#ededed', // Valor del color 1 de la cinta vacia en hexadecimal
    colorCintaVacia2: '#00FFFF', // Valor del color 2 de la cinta vacia en hexadecimal
    colorCintaVacia3: '#BABABA', // Valor del color 3 de la cinta vacia en hexadecimal
    colorRodilloSuperior: '#C90025', // Valor del color del rodillo superior en hexadecimal
    colorRodilloInferior1: '#119313', // Valor del color 1 del rodillo inferior en hexadecimal
    colorRodilloInferior2: '#055999', // Valor del color 2 del rodillo inferior en hexadecimal
    colorAlmohadilla: '#7F6E54', // Color de la almohadilla en hexadecimal
    colorMetalAlmohadilla: '#D14A00', // Color del metal de la almohadilla en hexadecimal
    colorCassette: 'rgba(159, 159, 159, .09)', // Color de la caja del cassette, puede ser en valor hexadecimal, rgb o rgba
    colorCassetteSuperior: 'rgba(159, 159, 159, .09)', // Color del rectangulo superior del cassette, puede ser en valor hexadecimal, rgb o rgba
    colorTornillo: '#333333', // Color de los tornillos en valor hexadecimal
    colorCruzTornillo: '#ffffff', // Color de la cruz dentro de los tornillos en hexadeciaml
};


/*
*    Eventos
*/
// Convertir los segundos a los valores de tiempo legibles
function getReadableTime(duration) {
    duration = parseInt(duration);

    let horas = Math.floor(duration / 3600),
        minutos = Math.floor((duration - (horas * 3600)) / 60),
        segundos = duration - (horas * 3600) - (minutos * 60),
        tiempo = "";

    if (horas < 10) { horas = "0" + horas; }
    if (minutos < 10) { minutos = "0" + minutos; }
    if (segundos < 10) { segundos = "0" + segundos; }

    if (horas === "00") {
        tiempo = minutos + "<span style='color: #e30052'>:</span>" + segundos;
    } else {
        tiempo = horas + "<span style='color: #e30052'>:</span>" + minutos + "<span style='color: #e30052'>:</span>" + segundos;
    }
    return tiempo;
}

// Convertir el tiempo del formato "00:00:00" a segundos
function getSecondsTime(duration) {
    if(typeof duration === "number") return duration;
    if(typeof duration !== "string") return 0;

    duration = duration.split(":");
    let time = 0;

    if(duration.length === 2) {
        time += Number(duration[0]) * 60;
        time += Number(duration[1]);
    } else if(duration.length === 3) {
        time += Number(duration[0]) * 3600;
        time += Number(duration[1]) * 60;
        time += Number(duration[2]);
    }

    return time;
}

function getShadowTam() { return (window.innerWidth <= 768) ? 60 : 75; }

// carga el recurso de la pista, ya sea la direción del mp3 o el base64
function setSource(source, type) {
    let isNotStream = RadioCassette.reproductorTipo !== ReproductorTipo.Stream,
        isType = type;
        
    return new Promise((resolve, reject) => {
        if(isNotStream){
            // Si la dirección contiene extensión js|txt|json o si es una url normal sin extensión
            // Se carga el valor del base64
            if(source.match(/\w+.(txt|json|js)/g) || (!source.match(/.+(mp3|ogg|opus|aac|m4a)/g)) && !isType){
                let script = document.createElement("script");

                script.onload = _ => {
                    player.src = base64;
                    script.remove();
                    resolve();
                }

                script.src = source;
                document.body.appendChild(script);
            }else if(source.match(/.+(mp3|ogg|opus|aac|m4a)/g) || isType){
                // cargar el archivo mp3|ogg|opus|aac|m4a
                player.src = source;
                resolve();
            }else{
                // capturar un error
                reject();
            }
        }else{
            player.src = source;
            resolve();
        }
    });
}

// Actualiza los diferentes indicadores: el tiempo transcurrido, el tiempo faltante, la barra de progreso, avanze da la cinta
function updateIndicators(currentTime, duration){
    let comodin = (duration >= 3600 && currentTime < 3600) ? "00<span style='color: #e30052'>:</span>" : "";

    currentTimeIndicator.innerHTML = comodin + getReadableTime(currentTime);
    rollerRightShadow = currentTime * headbandShadowProportion;
    rollerLeftShadow = getShadowTam() - rollerRightShadow;

    // Redibujar el rodo de la cinta y el recorrido de la misma
    drawRollerShadow();
    drawHeadband();

    // Si es el inico de la canción se inicia la animación de inicio de la cinta
    if(Math.floor(currentTime) <= 5){
        animationStartSong();
    }

    // Actualizar el porcentaje de avance
    progressValue.dispatchEvent(new CustomEvent('updateprogresssong', {
        detail: {
            value: Math.floor((currentTime * 100) / (duration - 1)),
            total: duration
        }
    }));

    // Para actualizar el tiempo restante si está habilitado
    if(RadioCassette.tiempoFinal == TiempoFinal.TiempoRestante){
        lastTimeIndicator.dispatchEvent(
            new CustomEvent('updateTiempoRestante', {
                detail: {
                    duration: duration - currentTime,
                    total: duration
                },
                bubbles: true,
                cancelable: true
            }));
    }
}

// Actualizar las etiquetas y tiempos a partir del tiempo actual de la pista
function onCurrentTimeInterval() {
    let duration = (RadioCassette.mostrarTiempoGeneral == 1) ? getSecondsTime(RadioCassette.valorTiempoGeneral) : player.duration;

    if(RadioCassette.reproductorTipo !== ReproductorTipo.Stream) {
        currentTime = (RadioCassette.mostrarTiempoGeneral == 1) ? acumulateTime + player.currentTime : player.currentTime;
    }else{
        currentTime++;
    }

    if(RadioCassette.reproductorTipo === ReproductorTipo.Stream){
        if(currentTime >= duration){
            updateIndicators(duration, duration);
            
            setTimeout(() => onClickBtnStop(), 500);

            setTimeout(() => { setSource(RadioCassette.url).then(() => onClickBtnStart()) }, 2000);
        }
    }
   
    //currentTime++;
    //console.log(currentTime, player.currentTime);
    if((currentTime < duration) && !player.change) {
        //currentTime++;
        updateIndicators(currentTime, duration);
    }
}

// Actualiza la etiqueta del tiempo restante
function onUpdateTiempoRestante(e) {
    let comodin = (e.detail.total >= 3600 && e.detail.duration < 3600) ? "00<span style='color: #e30052'>:</span>" : "";
    lastTimeIndicator.innerHTML = comodin + getReadableTime(e.detail.duration);
}

// Al cargar la pista actual, carga la duración y calcula el ángulo de rotación del brazo
function onLoadPlayerData() {
    let duration = (RadioCassette.reproductorTipo == ReproductorTipo.Playlist) ? player.duration : getSecondsTime(RadioCassette.valorTiempoGeneral);

    duration = (RadioCassette.mostrarTiempoGeneral == 1) ? getSecondsTime(RadioCassette.valorTiempoGeneral) : duration;
    
    let comodin = (duration >= 3600) ? "00<span style='color: #e30052'>:</span>" : "";

    clearInterval(reverseInterval);

    if(!player.change && RadioCassette.mostrarTiempoGeneral != 1) currentTimeIndicator.innerHTML = comodin + getReadableTime(0);
    lastTimeIndicator.innerHTML = comodin + (RadioCassette.tiempoFinal == 1) ? getReadableTime(duration) : getReadableTime(duration - currentTime);
    headbandShadowProportion = getShadowTam() / duration;
    isLoaded = true;
    player.change = false;
}

// Al iniciar la reproducción de la pista
function onPlayPlayer() {
    player.isStop = false;
    let shuffleCheck = [EstiloReproduccion.Shuffle, EstiloReproduccion.Sattolo];

    if(!isStarted){
        // Verificar si se va a reproducir por lista de canciones
        if(RadioCassette.reproductorTipo === ReproductorTipo.Playlist){
            if(RadioCassette.canciones.length > 0){
                if(shuffleCheck.indexOf(RadioCassette.estiloReproduccion) !== -1){
                    if(RadioCassette.estiloReproduccion === EstiloReproduccion.Shuffle && !player.back){
                        RadioCassette.canciones.shuffle();
                    }else if(!player.back){
                        RadioCassette.canciones.sattolo();
                    }
                    

                    console.log("----- Lista Inicial -----");
                    console.log(RadioCassette.canciones);
                }

                // Valores de la canción actual en reproducción
                currentSong = {
                    index: songIndex,
                    path: RadioCassette.canciones[songIndex].path,
                    type: (typeof RadioCassette.canciones[songIndex].type == "undefined") ? false : true
                };
            }

         // En caso de que se este reproduciendo por medio del enlace de la radio
        }else if(RadioCassette.reproductorTipo === ReproductorTipo.Stream){
            currentSong = {
                index: -1,
                path: RadioCassette.url
            }
        }

        setSource(currentSong.path, currentSong.type)
            .then(() => player.play())
            .catch(() => console.error("Error on load source: ", currentSong.path));

        isStarted = true;
    }

    player.back = false;
    btnPlay.classList.add("active");
    rollerLeft.classList.add("active");
    rollerRight.classList.add("active");
}

// Pausar la reproducción
function onPausePlayer() {
    //clearInterval(currentTimeInterval);
}

// Al finalizar la pista actual
function onEndedPlayerData() {
    let timeOutValue = 3000;

    Clean();

    if(RadioCassette.mostrarTiempoGeneral == 1 && !player.change){
        timeOutValue = 0;
        acumulateTime += getSecondsTime(RadioCassette.canciones[songIndex].duration);
        currentTime = acumulateTime;
        currentTimeIndicator.innerHTML = getReadableTime(currentTime);

        if(RadioCassette.tiempoFinal == 1){
            lastTimeIndicator.innerHTML = getReadableTime(RadioCassette.valorTiempoGeneral);
        }
        else{
            let value = getSecondsTime(RadioCassette.valorTiempoGeneral) - currentTime;
            lastTimeIndicator.innerHTML = getReadableTime(value);
        }
    }
    
    let playlistLength = RadioCassette.canciones.length;

    // Al reproducir por lista de canciones
    if(RadioCassette.reproductorTipo == ReproductorTipo.Playlist) {
        if(songIndex + 1 == playlistLength && EstiloReproduccion.Linear){
            onClickBtnStop();
            return;
        }

        // Si esta en modo LinearLoop o Shuffle, reinicia la reproducción de la lista al inicio
        if(RadioCassette.estiloReproduccion != EstiloReproduccion.Linear){
            let shuffleCheck = [EstiloReproduccion.Shuffle, EstiloReproduccion.Sattolo];
            songIndex = (songIndex + 1 == playlistLength) ? -1 : songIndex;

            if(songIndex == -1 && shuffleCheck.indexOf(RadioCassette.estiloReproduccion) !== -1){
                oldShuffleSongs = RadioCassette.canciones.copy();

                let lastSOngFromOldList = oldShuffleSongs[oldShuffleSongs.length - 1];

                do{
                    if(RadioCassette.estiloReproduccion === EstiloReproduccion.Shuffle){
                        RadioCassette.canciones.shuffle();
                    }else{
                        RadioCassette.canciones = oldShuffleSongs.copy();
                        RadioCassette.canciones.sattolo();
                    }
                }while(RadioCassette.canciones[0] === lastSOngFromOldList);

                console.log("----- Lista Antigua -----");
                console.log(oldShuffleSongs);
                console.log("----- Lista Nueva -----");
                console.log(RadioCassette.canciones);
            }
        }

        // Se obtiene los valores de la siguiente canción
        if(songIndex < playlistLength - 1){
            songIndex++;
            currentSong = {
                index: songIndex,
                path: RadioCassette.canciones[songIndex].path,
                type: (typeof RadioCassette.canciones[songIndex].type == "undefined") ? false : true
            }

            if(RadioCassette.mostrarTiempoGeneral !== 1) restartHeadband();

            setTimeout(() => {
                setSource(currentSong.path, currentSong.type)
                    .then(() => player.play())
                    .catch(() => console.error("Error on load source: ", currentSong.path));
            }, timeOutValue);
        }
    }
}

// Reiniciar el recorrido de la cinta
function restartHeadband() {
    rollerLeft.classList.add('reverse');
    rollerRight.classList.add('reverse');
    isReverse = true;

    let _duration = 0;

    animationEndSong();
    rollerLeftShadow = getShadowTam();
    rollerRightShadow = 0;

    setTimeout(() => {
        animationStartSong(true);
        drawRollerShadow();
        rollerLeftShadow = 0;
        rollerRightShadow = getShadowTam();

        reverseInterval = setInterval(() => { 
            if(_duration >= 1000){
                clearInterval(reverseInterval);
            }

            _duration+=10;
            rollerLeftShadow+=0.6;
            rollerRightShadow-=0.6;
            drawHeadband(); 
        }, 10);

        setTimeout(() => {
            rollerLeft.classList.remove('reverse');
            rollerRight.classList.remove('reverse');
            isReverse = false;
        }, 1000);
    }, 2000);
}

// Obtener el total de duración para el modo de mostrarTiempoTotal
function getTotalDurationForPlaylist() {
    if(RadioCassette.mostrarTiempoGeneral == 1 && RadioCassette.reproductorTipo == ReproductorTipo.Playlist){
        let durationSum = 0;

        for(let i=0; i < RadioCassette.canciones.length; i++){
            durationSum += getSecondsTime(RadioCassette.canciones[i].duration);
            RadioCassette.valorTiempoGeneral = durationSum;
        }

    }

    btnPlay.removeAttribute("disabled");
    btnPause.removeAttribute("disabled");
    btnBack.removeAttribute("disabled");
    btnForward.removeAttribute("disabled");
    btnStop.removeAttribute("disabled");
}

// Presionar el botón de inicio
function onClickBtnStart(e) {
    if(RadioCassette.reproductorTipo === ReproductorTipo.Stream){
        currentTimeInterval = setInterval(onCurrentTimeInterval, 1000);
        player.muted = false;
    }

    player.play();
    btnPlay.classList.add("active");
    rollerLeft.classList.add("active");
    rollerRight.classList.add("active");
}

// Presionar el botón de pausa
function onCLickBtnPause() {
    if(RadioCassette.reproductorTipo === ReproductorTipo.Stream){
        clearInterval(currentTimeInterval);
        player.muted = true;
    }

    if(btnPlay.classList.contains("active") && RadioCassette.reproductorTipo !== ReproductorTipo.Stream){
        player.pause();
    }

    btnPlay.classList.remove("active");
    rollerLeft.classList.remove("active");
    rollerRight.classList.remove("active");
}

// Presionar el botón de retroceder
function onClickBtnBack() {
    let duration = (RadioCassette.mostrarTiempoGeneral == 1) ? getSecondsTime(RadioCassette.valorTiempoGeneral) : player.duration;

    if(RadioCassette.reproductorTipo !== ReproductorTipo.Stream){
        songIndex = (songIndex - 1 <= 0) ? 0 : (songIndex - 1);
        clearInterval(currentTimeInterval);

        player.pause();
        player.back = true;
        player.change = true;

        if(songIndex === 0){
            onClickBtnStop();
            player.back = true;
            setTimeout(onClickBtnStart, 100);
        }else{
            acumulateTime -= getSecondsTime(RadioCassette.canciones[songIndex].duration) + 1;
            currentTime = (acumulateTime >= 0) ? acumulateTime : 0;

            // Valores de la canción actual en reproducción
            currentSong = {
                index: songIndex,
                path: RadioCassette.canciones[songIndex].path,
                type: (typeof RadioCassette.canciones[songIndex].type == "undefined") ? false : true
            };

            if(RadioCassette.mostrarTiempoGeneral == 1){
                updateIndicators(currentTime, duration);
            }

            setSource(currentSong.path, currentSong.type)
                .then(() => player.play())
                .catch(() => console.error("Error on load source: ", currentSong.path));
        }
    }
}

// Presionar el botón de avanzar
function onClickBtnForward() {
    let playlistLength = RadioCassette.canciones.length;
    let duration = (RadioCassette.mostrarTiempoGeneral == 1) ? getSecondsTime(RadioCassette.valorTiempoGeneral) : player.duration;

    // Al reproducir por lista de canciones
    if(RadioCassette.reproductorTipo == ReproductorTipo.Playlist && isLoaded) {
        clearInterval(currentTimeInterval);
        player.pause();

        if(songIndex < playlistLength - 1) {
            acumulateTime+= getSecondsTime(RadioCassette.canciones[songIndex].duration);
            currentTime = acumulateTime;
            player.change = true;

            if(RadioCassette.mostrarTiempoGeneral == 1){
                updateIndicators(currentTime, duration);
            }

            // Se obtiene los valores de la siguiente canción
            songIndex++;
            currentSong = {
                index: songIndex,
                path: RadioCassette.canciones[songIndex].path,
                type: (typeof RadioCassette.canciones[songIndex].type == "undefined") ? false : true
            }

            setSource(currentSong.path, currentSong.type)
                .then(() => player.play())
                .catch(() => console.error("Error on load source: ", currentSong.path));
        }else{
            player.currentTime = player.duration;
        }
    }
}

// Actualiza el valor de la etiqueta del porcentaje de progreso
function onUpdateProgressSong(e){
    let value = e.detail.value,
        _width = Number($('.bars').css('width').split('px').join(''));

    value = (value <= 100) ? value : 100;
    _width = ((_width - Number($('.progress-song').css('width').split('px').join(''))) * value) / 100;

    progressValue.textContent = value;
    progressBar.css({ width:  _width+'px'});
}

// Presionar el botón de detener
function onClickBtnStop(e) {
    player.stop();
    player = new _Audio();

    if(RadioCassette.reproductorTipo === RadioCassette.Stream)
        clearInterval(currentTimeInterval);
}

// Reinicar los valores de las distintas etiquetas
function Clean() {
    player.pause();
    player.duration = 0;

    currentTime = 0;
    headbandShadowProportion = 0;

    currentTimeIndicator.innerHTML = getReadableTime(0);
    lastTimeIndicator.innerHTML = getReadableTime(0);

    progressValue.textContent = 0;
    progressBar.css({ width:  0});

    $('#headband-copy3').css('transition-delay', '');
    $('#headband-copy2').css('transition-delay', '');

    clearInterval(reverseInterval);

    btnPlay.classList.remove("active");
    rollerLeft.classList.remove("active");
    rollerRight.classList.remove("active");
}

// Audio Prototypes
function _Audio() {
    let _audio = new Audio();

    // - Load array of song's
    _audio.songIndex = -1;
    // Detener la reproducción
    _audio.isStop = true;
    _audio.change  = false;
    _audio.back = false;
    _audio.stop =function() {
        this.isStop = true;
        isStarted = false;
        songIndex = 0;
        acumulateTime = 0;
        currentTime = 0;
        rollerLeftShadow = getShadowTam();
        rollerRightShadow = 0;

        headband.css({ strokeDashoffset: 0 });
        $('#headband-copy3').css({strokeDashoffset: 0});
        $('#headband-copy2').css({strokeDashoffset: 0});

        clearInterval(reverseInterval);
        clearInterval(currentTimeInterval);

        Clean();
        drawHeadband();
        drawRollerShadow();

        setTimeout(() => {
            currentTimeIndicator.innerHTML = getReadableTime(0);
            lastTimeIndicator.innerHTML = getReadableTime(0);
            progressValue.textContent = "0";
            rollerLeft.classList.remove("active");
            rollerRight.classList.remove("active");

            root.set('transitioncinta', '0s');
            root.set('transitioncintavacia1', '0s');
            root.set('transitioncintavacia2', '0s');

            headband.css({ strokeDashoffset: totalOffset });
            $('#headband-copy3').css({strokeDashoffset: totalOffset * 0.45});
            $('#headband-copy2').css({strokeDashoffset: totalOffset * 0.16});

            setTimeout(() => {
                root.set('transitioncinta', '5s');
                root.set('transitioncintavacia1', '2.8s');
                root.set('transitioncintavacia2', '1.5s');
            }, 100);
        }, 10);
    }

    _audio
        .on("loadeddata", onLoadPlayerData)
        .on("timeupdate", (RadioCassette.reproductorTipo !== ReproductorTipo.Stream) ? onCurrentTimeInterval : function(){})
        .on("play", onPlayPlayer)
        .on("pause", onPausePlayer)
        .on("ended", onEndedPlayerData);

    return _audio;
}

// Dibujar el recorrido de la cinta
function drawHeadband() {

    let [_width, _height] = $('.cassett').css(['width', 'height']).map(i => i.numberFromPx()),
        _oldpath = headband.getAttribute('d'),
        _path = '';

    headbandContainer.setAttribute('viewBox', `0 0 ${_width} ${_height}`);

        let rollerLeft_Left = rollerLeft.css('left').numberFromPx(),
            rollerLeft_Top = rollerLeft.css('top').numberFromPx(),
            rollerFixed1_Left = $('.roller-fixed-min-1').css('left').numberFromPx(),
            rollerFixed1_Top = $('.roller-fixed-min-1').css('top').numberFromPx(),
            rollerFixed1_Height = $('.roller-fixed-min-1').offsetHeight,
            rollerLeftTop_Left = $('.roller-left').css('left').numberFromPx(),
            rollerLeftTop_Top = $('.roller-left').css('top').numberFromPx(),
            rollerLeftTop_Height = $('.roller-left').offsetHeight,
            rollerLeftTop_Width = $('.roller-left').offsetWidth,
            rollerRight_Left = rollerRight.css('left').numberFromPx(),
            rollerRight_Top = rollerRight.css('top').numberFromPx(),
            rollerFixed2_Left = $('.roller-fixed-min-2').css('left').numberFromPx(),
            rollerFixed2_Top = $('.roller-fixed-min-2').css('top').numberFromPx(),
            rollerFixed2_Height = $('.roller-fixed-min-2').offsetHeight,
            rollerFixed2_Width = $('.roller-fixed-min-2').offsetWidth,
            rollerRightTop_Left = $('.roller-right').css('left').numberFromPx(),
            rollerRightTop_Top = $('.roller-right').css('top').numberFromPx(),
            rollerRightTop_Height = $('.roller-right').offsetHeight,
            rollerRightTop_Width = $('.roller-right').offsetWidth;
        
        _path = `
        M ${rollerLeft_Left - rollerLeftShadow}, ${rollerLeft_Top + (rollerLeft.offsetHeight / 2)}

        L ${ rollerFixed1_Left }, ${ rollerFixed1_Top + (rollerFixed1_Height / 2) + 2 }

        L ${ rollerLeftTop_Left }, ${ rollerLeftTop_Top + (rollerLeftTop_Height / 2) }

        L ${ rollerLeftTop_Left + (rollerLeftTop_Width / 2) }, ${ rollerLeftTop_Top }

        L ${ rollerRightTop_Left + (rollerRightTop_Width) / 2 }, ${ rollerRightTop_Top }

        L ${ rollerRightTop_Left + (rollerRightTop_Width) }, ${ rollerRightTop_Top + (rollerRightTop_Height / 2) }

        L ${ rollerFixed2_Left + (rollerFixed2_Width) }, ${ rollerFixed2_Top + (rollerFixed2_Height / 2) + 2 }

        L ${rollerRight_Left + rollerRight.offsetWidth + rollerRightShadow}, ${rollerRight_Top + (rollerRight.offsetHeight / 2)}
    `

    headband.setAttribute('d', _path);
    $('.headband-copy').forEach(node => node.setAttribute('d', _path));

    totalOffset = headband.getTotalLength();
    root.set('largocinta', totalOffset);
}

// Dibujar cinta contenido en los rodillos inferiores
function drawRollerShadow() {
    root.set('cintaizquierda', `${rollerLeftShadow}px`);
    root.set('cintaderecha', `${rollerRightShadow}px`);
}

// Función para la animación del recorrido de la cinta en el inicio de la canción
function animationStartSong(reverse=false) {
    if(!reverse){
        root.set('transitioncinta', '5s');
        root.set('transitioncintavacia1', '2.8s');
        root.set('transitioncintavacia2', '1.5s');

        headband.css({strokeDashoffset: 0});
        $('#headband-copy3').css({strokeDashoffset: 0});
        $('#headband-copy2').css({strokeDashoffset: 0});
    }else{
        root.set('transitioncinta', '1s');
        root.set('transitioncintavacia1', '.56s');
        root.set('transitioncintavacia2', '.3s');

        headband.css({ strokeDashoffset: totalOffset - 5 });
        $('#headband-copy3').css({strokeDashoffset: totalOffset * 0.45});
        $('#headband-copy2').css({strokeDashoffset: totalOffset * 0.16});
    }
}

// Función para la animación del recorrido de la cinta al final de la canción
function animationEndSong() {
    root.set('transitioncinta', '1s');
    root.set('transitioncintavacia1', '.68s');
    root.set('transitioncintavacia2', '.3s');
    $('#headband-copy3').css('transition-delay', '.5s');
    $('#headband-copy2').css('transition-delay', '.8s');

    headband.css({ strokeDashoffset: -totalOffset });
    $('#headband-copy3').css({strokeDashoffset: -(totalOffset * 0.45)});
    $('#headband-copy2').css({strokeDashoffset: -(totalOffset * 0.16)});
}


window.on('load', () => {
    // Cargar las configuraciones del tocadiscos
    titleText.textContent = RadioCassette.textoTitulo;
    titleImage.src = RadioCassette.imagenTitulo;

    sloganText.textContent = RadioCassette.textoEslogan;
    sloganImage.src = RadioCassette.imagenEslogan;

    // Se establecen los colores de cada uno de los componentes del cassette
    root.set('coloralmohadilla', RadioCassette.colorAlmohadilla);
    root.set('colormetalalmohadilla', RadioCassette.colorMetalAlmohadilla);

    root.set('colorcinta', RadioCassette.colorCinta);
    root.set('colorcintavacia1', RadioCassette.colorCintaVacia1);
    root.set('colorcintavacia2', RadioCassette.colorCintaVacia2);
    root.set('colorcintavacia3', RadioCassette.colorCintaVacia3);

    root.set('colorrodillosuperior', RadioCassette.colorRodilloSuperior);
    root.set('colorrodilloinferior1', RadioCassette.colorRodilloInferior1);
    root.set('colorrodilloinferior2', RadioCassette.colorRodilloInferior2);

    root.set('colorcassette', RadioCassette.colorCassette);
    root.set('colorcassettesuperior', RadioCassette.colorCassetteSuperior);

    root.set('colortornillo', RadioCassette.colorTornillo);
    root.set('colorcruztornillo', RadioCassette.colorCruzTornillo);

    RadioCassette.mostrarTiempoGeneral = (RadioCassette.reproductorTipo == ReproductorTipo.Stream) ? 1 : RadioCassette.mostrarTiempoGeneral;

    player = new _Audio();
    oldShadowTam = getShadowTam();

    getTotalDurationForPlaylist();
    drawHeadband();
    drawRollerShadow();

    totalOffset = headband.getTotalLength();
    headband.css({ strokeDashoffset: totalOffset });
    $('#headband-copy3').css({strokeDashoffset: totalOffset * 0.45});
    $('#headband-copy2').css({strokeDashoffset: totalOffset * 0.16});
    setTimeout(() => {
        root.set('transitioncinta', '5s');
        root.set('transitioncintavacia1', '2.8s');
        root.set('transitioncintavacia2', '1.5s');
    }, 100);


    window.on('resize', () => { 
        if(oldShadowTam == 60 && getShadowTam() != 60){
            rollerLeftShadow = (rollerLeftShadow != 0) ? (rollerLeftShadow * 75) / 60 : rollerLeftShadow;
            rollerRightShadow = (rollerRightShadow != 0) ? (rollerRightShadow * 75) / 60 : rollerRightShadow;
        }else if(oldShadowTam == 75 && getShadowTam() != 75){
            rollerLeftShadow = (rollerLeftShadow != 0) ? (rollerLeftShadow * 60) / 75 : rollerLeftShadow;
            rollerRightShadow = (rollerRightShadow != 0) ? (rollerRightShadow * 60) / 75 : rollerRightShadow;
        }

        oldShadowTam = getShadowTam();
        drawRollerShadow();
        drawHeadband();

        root.set('transitioncinta', '0s');
        root.set('transitioncintavacia1', '0s');
        root.set('transitioncintavacia2', '0s');

        headband.css({ strokeDashoffset: totalOffset });
        $('#headband-copy3').css({strokeDashoffset: totalOffset * 0.45});
        $('#headband-copy2').css({strokeDashoffset: totalOffset * 0.16});

        setTimeout(() => {
            root.set('transitioncinta', '5s');
            root.set('transitioncintavacia1', '2.8s');
            root.set('transitioncintavacia2', '1.5s');
        }, 100);
    });

    btnPlay.on('click', onClickBtnStart);
    btnPause.on('click', onCLickBtnPause);
    btnBack.on('click', onClickBtnBack);
    btnForward.on('click', onClickBtnForward);
    btnStop.on("click", onClickBtnStop);

    progressValue.on('updateprogresssong', onUpdateProgressSong);
    lastTimeIndicator.on('updateTiempoRestante', onUpdateTiempoRestante);
});