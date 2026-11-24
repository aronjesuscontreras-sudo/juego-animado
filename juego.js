var lienzo = document.getElementById("lienzo");
var ctx = lienzo.getContext("2d");

var pantallaInicio = document.getElementById("inicio");
var pantallaFin = document.getElementById("fin");
var textoFinal = document.getElementById("textoFinal");
var spanPuntos = document.getElementById("puntos");
var spanVidas = document.getElementById("vidas");
var spanRecord = document.getElementById("record");

var ANCHO = lienzo.width;
var ALTO = lienzo.height;

var jugando = false;
var puntos = 0;
var vidas = 3;
var record = 0;
var velocidad = 2;      // velocidad de caida, va subiendo
var contador = 0;       // para saber cada cuanto sale un objeto nuevo
var objetos = [];
var chispas = [];       // efectito cuando atrapas algo
var nubes = [];

// el carrito
var carro = {
  x: 250,
  y: ALTO - 50,
  ancho: 90,
  alto: 35,
  vel: 7
};

var izquierda = false;
var derecha = false;

// guardar el record si ya habia uno
if (localStorage.getItem("recordIEST")) {
  record = parseInt(localStorage.getItem("recordIEST"));
  spanRecord.innerHTML = record;
}

// nubes de fondo
for (var i = 0; i < 5; i++) {
  nubes.push({
    x: Math.random() * ANCHO,
    y: 20 + Math.random() * 150,
    v: 0.2 + Math.random() * 0.4
  });
}

// ---------- controles ----------
document.addEventListener("keydown", function (e) {
  if (e.key == "ArrowLeft" || e.key == "a") izquierda = true;
  if (e.key == "ArrowRight" || e.key == "d") derecha = true;
});

document.addEventListener("keyup", function (e) {
  if (e.key == "ArrowLeft" || e.key == "a") izquierda = false;
  if (e.key == "ArrowRight" || e.key == "d") derecha = false;
});

// mouse
lienzo.addEventListener("mousemove", function (e) {
  var r = lienzo.getBoundingClientRect();
  var escala = ANCHO / r.width;
  carro.x = (e.clientX - r.left) * escala - carro.ancho / 2;
});

// celular
lienzo.addEventListener("touchmove", function (e) {
  e.preventDefault();
  var r = lienzo.getBoundingClientRect();
  var escala = ANCHO / r.width;
  carro.x = (e.touches[0].clientX - r.left) * escala - carro.ancho / 2;
}, { passive: false });

document.getElementById("btnJugar").onclick = empezar;
document.getElementById("btnOtra").onclick = empezar;

function empezar() {
  puntos = 0;
  vidas = 3;
  velocidad = 2;
  contador = 0;
  objetos = [];
  chispas = [];
  carro.x = ANCHO / 2 - carro.ancho / 2;
  spanPuntos.innerHTML = 0;
  spanVidas.innerHTML = 3;
  pantallaInicio.classList.add("oculto");
  pantallaFin.classList.add("oculto");
  jugando = true;
}

// ---------- objetos que caen ----------
function crearObjeto() {
  var n = Math.random();
  var tipo;
  if (n < 0.6) tipo = "engranaje";
  else if (n < 0.75) tipo = "rayo";
  else tipo = "corto";

  objetos.push({
    tipo: tipo,
    x: 20 + Math.random() * (ANCHO - 40),
    y: -20,
    giro: 0,
    r: 16
  });
}

function dibujarEngranaje(x, y, r, giro) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(giro);
  ctx.fillStyle = "#7a7a7a";
  // dientes
  for (var i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -r - 5, 8, 10);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dff3ff";
  ctx.beginPath();
  ctx.arc(0, 0, r / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarRayo(x, y) {
  ctx.fillStyle = "#ffcc00";
  ctx.strokeStyle = "#b38600";
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 18);
  ctx.lineTo(x - 10, y + 2);
  ctx.lineTo(x - 1, y + 2);
  ctx.lineTo(x - 5, y + 18);
  ctx.lineTo(x + 11, y - 4);
  ctx.lineTo(x + 2, y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function dibujarCorto(x, y, giro) {
  // bolita roja con chispas
  ctx.fillStyle = "#e01010";
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff8800";
  ctx.lineWidth = 3;
  for (var i = 0; i < 6; i++) {
    var a = giro * 3 + i * (Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14);
    ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = "white";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("X", x, y + 5);
}

function dibujarCarro() {
  var x = carro.x;
  var y = carro.y;
  // cuerpo
  ctx.fillStyle = "#c8102e";
  ctx.fillRect(x, y, carro.ancho, carro.alto - 10);
  // borde de arriba
  ctx.fillStyle = "#0b3d91";
  ctx.fillRect(x - 4, y - 5, carro.ancho + 8, 8);
  // ruedas
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(x + 20, y + carro.alto - 8, 9, 0, Math.PI * 2);
  ctx.arc(x + carro.ancho - 20, y + carro.alto - 8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#aaa";
  ctx.beginPath();
  ctx.arc(x + 20, y + carro.alto - 8, 3, 0, Math.PI * 2);
  ctx.arc(x + carro.ancho - 20, y + carro.alto - 8, 3, 0, Math.PI * 2);
  ctx.fill();
}

function sacarChispas(x, y, color) {
  for (var i = 0; i < 10; i++) {
    chispas.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      vida: 25,
      color: color
    });
  }
}

function perderVida() {
  vidas--;
  spanVidas.innerHTML = vidas;
  if (vidas <= 0) terminar();
}

function terminar() {
  jugando = false;
  if (puntos > record) {
    record = puntos;
    localStorage.setItem("recordIEST", record);
    spanRecord.innerHTML = record;
    textoFinal.innerHTML = "¡Nuevo récord! Hiciste " + puntos + " puntos";
  } else {
    textoFinal.innerHTML = "Hiciste " + puntos + " puntos";
  }
  pantallaFin.classList.remove("oculto");
}

// ---------- actualizar ----------
function actualizar() {
  // nubes
  for (var i = 0; i < nubes.length; i++) {
    nubes[i].x += nubes[i].v;
    if (nubes[i].x > ANCHO + 50) nubes[i].x = -50;
  }

  // chispas
  for (var i = chispas.length - 1; i >= 0; i--) {
    var c = chispas[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vida--;
    if (c.vida <= 0) chispas.splice(i, 1);
  }

  if (!jugando) return;

  // mover carrito
  if (izquierda) carro.x -= carro.vel;
  if (derecha) carro.x += carro.vel;
  if (carro.x < 0) carro.x = 0;
  if (carro.x > ANCHO - carro.ancho) carro.x = ANCHO - carro.ancho;

  // sacar objetos
  contador++;
  if (contador > 50 - velocidad * 3) {
    crearObjeto();
    contador = 0;
  }

  for (var i = objetos.length - 1; i >= 0; i--) {
    var o = objetos[i];
    o.y += velocidad;
    o.giro += 0.05;

    // choca con el carrito?
    if (o.y + o.r > carro.y && o.y - o.r < carro.y + 15 &&
        o.x > carro.x - 5 && o.x < carro.x + carro.ancho + 5) {

      if (o.tipo == "engranaje") {
        puntos += 10;
        sacarChispas(o.x, o.y, "#999");
      } else if (o.tipo == "rayo") {
        puntos += 30;
        sacarChispas(o.x, o.y, "#ffcc00");
      } else {
        sacarChispas(o.x, o.y, "#ff3300");
        perderVida();
      }
      spanPuntos.innerHTML = puntos;
      objetos.splice(i, 1);

      // cada 100 puntos sube la velocidad un poquito
      velocidad = 2 + Math.floor(puntos / 100) * 0.4;
      if (velocidad > 7) velocidad = 7;
      continue;
    }

    // se cayo al piso
    if (o.y > ALTO + 20) {
      if (o.tipo == "engranaje") perderVida();
      objetos.splice(i, 1);
    }
  }
}

// ---------- dibujar ----------
function dibujar() {
  ctx.clearRect(0, 0, ANCHO, ALTO);

  // cielo
  ctx.fillStyle = "#dff3ff";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // nubes
  ctx.fillStyle = "white";
  for (var i = 0; i < nubes.length; i++) {
    var n = nubes[i];
    ctx.beginPath();
    ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
    ctx.arc(n.x + 20, n.y + 5, 22, 0, Math.PI * 2);
    ctx.arc(n.x + 42, n.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // piso
  ctx.fillStyle = "#4a7a3a";
  ctx.fillRect(0, ALTO - 15, ANCHO, 15);

  // objetos
  for (var i = 0; i < objetos.length; i++) {
    var o = objetos[i];
    if (o.tipo == "engranaje") dibujarEngranaje(o.x, o.y, o.r, o.giro);
    else if (o.tipo == "rayo") dibujarRayo(o.x, o.y);
    else dibujarCorto(o.x, o.y, o.giro);
  }

  dibujarCarro();

  // chispas
  for (var i = 0; i < chispas.length; i++) {
    var c = chispas[i];
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, 4, 4);
  }
}

function bucle() {
  actualizar();
  dibujar();
  requestAnimationFrame(bucle);
}

bucle();
