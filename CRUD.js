var express = require('express');
var app = express();
const http = require('http')
var sqlite3 = require('sqlite3');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rutasProtegidas = express.Router(); 
config = require('./configs/config');
bodyParser = require('body-parser');
app.use(cors());
app.set('llave', config.llave);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Creando base de datos
function createDatabase() {
    console.log('Creando base de datos');

    let db = new sqlite3.Database('./users.db', (err) => {
        if(err){
            console.log("Error: " + err);
            return false;
        }else {
            console.log('Creando base de datos para usuarios');
            db.exec(`create table users(id int primary key not null, user text not null, password text not null); 
            insert into users values(1,'jorge@admin.com', '1234'); 
            `);
        }
    });
    db.close();
    return true;
}

function createMovieDatabase() {
    console.log('Creando base de datos de peliculas');

    let db = new sqlite3.Database('./movielist.db', (err) => {
        if(err){
            console.log("Error: " + err);
            return false;
        }else {
            console.log('Creando base de datos de peliculas');
            db.exec(`create table movielist(titulo text primary key not null, year int not null, sinopsis text not null, autor text not null, url text not null); 
            insert into movielist values('Avengers end game',2019,'Los avengers regresan al pasado para derrotar a thanos', 'MARVEL', 'http://pelicula.com'); 
            insert into movielist values('Toy Story 3',2019,'Los jugetes de andy vuelven a las andadas', 'Disney Pixar', 'http://pelicula.com'); 
            `);
        }
    });
    db.close();
    return true;
}

function createFavoriteMoviesDatabase() {
    console.log('Creando base de datos de peliculas favoritas');

    let db = new sqlite3.Database('./movieFavorite.db', (err) => {
        if(err){
            console.log("Error: " + err);
            return false;
        }else {
            console.log('Creando base de datos de peliculas');
            db.exec(`create table movielist(titulo text primary key not null, year int not null, sinopsis text not null, autor text not null, url text not null);
            `);
        }
    });
    db.close();
    return true;
}

//API para genera token 
//-------------------------------------------------------------------------
 app.post('/api/signup', (req, res) => { 
    const username = req.query.username;
    const password = req.query.password;
    if(username === "jorge@admin.com" && password === "1234") { 
  const payload = { 
   check: true 
  }; 
  const token = jwt.sign(payload, app.get('llave'), { 
   expiresIn: 1440 
  }); 
  res.json({ 
   mensaje: 'Autenticación correcta', 
   token: token 
  }); 
    } else { 
        res .json({mensaje: "Usuario o contraseña incorrecta"}) 
    } 
})

rutasProtegidas.use((req, res, next) => {
    const token = req.headers['access-token'];
    if (token) {
      jwt.verify(token, app.get('llave'), (err, decoded) => {      
        if (err) {
          return res.json({ mensaje: 'Token inválida' });    
        } else {
          req.decoded = decoded;    
          next();
        }
      });
    } else {
      res.send({ 
          mensaje: 'Token no proveída.' 
      });
    }
 });
//--------------------------------------------------------------

//API para obtener usuarios
app.get('/users', function(req, res) {
        let db = new sqlite3.Database('./users.db');
        db.all("SELECT * FROM users ORDER BY id, user", 
        function(err,rows){
            let carroStr = JSON.stringify(rows);
            res.end(carroStr);
        })
  })

app.get('/movies',rutasProtegidas, function(req,res){
    let db = new sqlite3.Database('./movielist.db');
    db.all("SELECT * FROM movielist ORDER BY titulo, autor", 
    function(err,rows){
        let carroStr = JSON.stringify(rows);
        res.end(carroStr);
    });
})

//Agregando nueva info
app.post('/userAdd',rutasProtegidas, function(req,res){
    const _id = req.query.id;
    const _user = req.query.user;
    const _password = req.query.password;
    let db = new sqlite3.Database('./users.db');
    let resultado = db.run(`insert into users values(?, ?, ?);`, [_id, _user, _password]);
    res.end('ok');
})

app.post('/moviesAdd',rutasProtegidas, function(req,res){
    const _titulo = req.query.titulo;
    const _year = req.query.year;
    const _sinopsis = req.query.sinopsis;
    const _autor = req.query.autor;
    const _url = req.query.url;
    let db = new sqlite3.Database('./movielist.db');
    let resultado = db.run(`insert into movielist values(?, ?, ?, ?, ?);`, [_titulo, _year, _sinopsis, _autor, _url]);
    res.end('ok');
})

//Actualizacion de datos.
app.post('/updateUser',rutasProtegidas, function(req, res) {
    const _user = req.query.user;
    const _password = req.query.password;
    let db = new sqlite3.Database('./users.db');
    let resultado = db.run(`update users set user = ?, password = ? where user = ?`, [_user,_password]);
    res.end('ok');
})

app.post('/updateMovie',rutasProtegidas, function(req, res) {
    const _titulo = req.query.titulo;
    const _year = req.query.year;
    const _sinopsis = req.query.sinopsis;
    const _autor = req.query.autor;
    const _url = req.query.url; 
    console.log(_titulo);
    let db = new sqlite3.Database('./movielist.db');
    let resultado = db.run(`update movielist set year = ?, sinopsis = ?, autor = ?, url = ? where titulo = ?`, [_year, _sinopsis, _autor, _url, _titulo]);
    res.end('ok');
})

//Borrar informacion.
app.delete('/deleteUser',rutasProtegidas, function(req,res) {
    const _user = req.query.user;

    let db = new sqlite3.Database('./users.db');
    let resultado = db.run(`delete from users where user = ?;`, [_user]);
    res.end('Ok');
})

app.delete('/deleteMovie',rutasProtegidas, function(req,res) {
    const _titulo = req.query.titulo;

    let db = new sqlite3.Database('./movielist.db');
    let resultado = db.run(`delete from movielist where titulo = ?;`, [_titulo]);
    res.end('Ok');
})

//Iniciar el servidor.
var server = app.listen(8080, function() {
    var host = server.address().address
    var port = server.address().port

    let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
        if(err && err.code == "SQLITE_CANTOPEN") {
            db.close();
            console.log("Iniciando creacion de base de datos");
            createDatabase();
            return;
        }else if(err){
            console.log("Error " + err);
            exit(1);
        }else {
            console.log("Despliegue de la base de datos ejecutado con exito");
        }
    });

    let dbMovies = new sqlite3.Database('./movielist.db', sqlite3.OPEN_READWRITE, (err) => {
        if(err && err.code == "SQLITE_CANTOPEN") {
            dbMovies.close();
            console.log("Iniciando creacion de base de datos");
            createMovieDatabase();
            return;
        }else if(err){
            console.log("Error " + err);
            exit(1);
        }else {
            console.log("Despliegue de la base de datos ejecutado con exito");
        }
    });

    let dbFavoriteMovie = new sqlite3.Database('./movieFavorite.db', sqlite3.OPEN_READWRITE, (err) => {
        if(err && err.code == "SQLITE_CANTOPEN") {
            dbFavoriteMovie.close();
            console.log("Iniciando creacion de base de datos");
            createFavoriteMoviesDatabase();
            return;
        }else if(err){
            console.log("Error " + err);
            exit(1);
        }else {
            console.log("Despliegue de la base de datos ejecutado con exito");
        }
    });
    console.log('Servidor escuchando en http://%s:%s', host, port);
})

