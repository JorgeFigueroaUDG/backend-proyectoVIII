var express = require('express');
var app = express();
var sqlite3 = require('sqlite3');
const cors = require('cors');

app.use(cors());

function createDatabase() {
    console.log('Creando base de datos');

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

//Lectura - READ
app.get('/movies', function(req,res){
    let db = new sqlite3.Database('./movielist.db');
    db.all("SELECT * FROM movielist ORDER BY titulo, autor", 
    function(err,rows){
        let carroStr = JSON.stringify(rows);
        res.end(carroStr);
    });
})

//Agregando nueva info
app.post('/moviesAdd', function(req,res){
    const _titulo = req.query.titulo;
    const _year = req.query.year;
    const _sinopsis = req.query.sinopsis;
    const _autor = req.query.autor;
    const _url = req.query.url;
    let db = new sqlite3.Database('./movielist.db');
    let resultado = db.run(`insert into movielist values(?, ?, ?, ?, ?);`, [_titulo, _year, _sinopsis, _autor, _url]);
    res.end('ok');
})

app.post('/updateMovie', function(req, res) {
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

//Iniciar el servidor.
var server = app.listen(8080, function() {
    var host = server.address().address
    var port = server.address().port

    let db = new sqlite3.Database('./movielist.db', sqlite3.OPEN_READWRITE, (err) => {
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
    console.log('Servidor escuchando en http://%s:%s', host, port);
})