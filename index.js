'use strict'
var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var cors = require('cors')
app.use(cors())
app.use(bodyParser.json());

var pool = require('./database');
const PORT = process.env.PORT || 5000

app.get('/books', async function (req, res) {
  let result = await pool.query('SELECT * FROM summary');
  res.send(result);
});

app.get("/book/:id", async function(req, res) {
  const id = req.params.id;
  console.log(req.params.id);
  
  try {
    let result = await pool.query(`SELECT * FROM summary WHERE ID = ${id}`);
      if (!result.length) {
        res.status(404);
        res.send(
          {
            "code": 404,
            "message": "Resource not found.",
            "description": "The resource with id = " + id + " does not exist."
          });
      } else {
        res.send(result);
      }
      console.log(result);
  } catch(err) {
      res.send({err});
      throw new Error(err);
  }
  
});

app.get('/authors', async function (req, res) {
  let result = await pool.query('SELECT tekija_id AS id, tekija_nimi AS name FROM tekija');
  res.send(result);
});

app.get('/shelves', async function (req, res) {
  let result = await pool.query('SELECT hylly_id AS id, hylly_nimi AS name FROM hylly');
  res.send(result);
});

app.get('/genres', async function (req, res) {
  let result = await pool.query('SELECT tyylilaji_id AS id, tyylilaji_nimi AS name FROM tyylilaji');
  res.send(result);
});

app.get('/author/:id', async function (req, res) {
    const id = req.params.id;

    let author = await pool.query(`SELECT tekija_nimi AS name FROM tekija WHERE tekija_id = ${id}`);
    let books = await pool.query(`SELECT * FROM summary WHERE tekija_id = ${id}`);
    
    const len = books.length;
    
    res.send({author, books});
  });

app.post("/add/book", async function(req,res) {
    const name = req.body.name;
    const laji = req.body.alaji;
    const isbn = req.body.isbn;
    const tekija = req.body.authorId;
    const kuvaus = req.body.description;
    const vuosi = req.body.year;
    const lisatiedot = req.body.info;
    const hylly = req.body.shelfId;
    const tila = req.body.status;
    const arr = [ name, laji, isbn, tekija, kuvaus, vuosi, lisatiedot, hylly, tila ]
    
    let result = await pool.query(`INSERT INTO teos (teos_nimi, teos_aineistolaji_id, teos_isbn, teos_tekija_id, teos_kuvaus, teos_vuosi, teos_lisatiedot, teos_hylly_id, teos_tila_id) VALUES 
    ('${name}','${laji}','${isbn}','${tekija}','${kuvaus}','${vuosi}','${lisatiedot}','${hylly}','${tila}');`);
    
    const id = result.insertId;
    console.log(id)
    res.status(201);
  // res.append('Location', 'http://192.168.1.51/authors/' + id);
    res.send({name});
    console.log(arr);
    addGenre(id, req.body.genre);
});

async function addGenre(id, g) {
  console.log(g);
  for (let i = 0; i < g.length; i++) {
    console.log(id, g[i]);
    let result = await pool.query(`INSERT INTO tyylilajilista (tl_teos_id, tl_tyylilaji_id) VALUES (${id}, ${g[i]});`);
    console.log(result.insertId);
  }
}

app.post("/add/author", async function(req,res) {
    const name = req.body.name;
    let result = await pool.query(`INSERT INTO tekija (tekija_nimi) VALUES ('${name}')`);
    const id = result.insertId;
    
    res.status(201);
    //res.append('Location', 'http://192.168.1.51/authors/' + id);
    res.send({name, id});

});

app.post("/update/author", async function(req,res) {
  const name = req.body.name;
  const id = req.body.id;
  let result = await pool.query(`UPDATE tekija SET tekija_nimi = '${name}' WHERE tekija_id = '${id}'`);
  
  console.log(result);
  res.status(201);
  //res.append('Location', 'http://192.168.1.51/authors/' + id);
  res.send({name, id});

});

app.post("/add/genre", async function(req,res) {
    const genre = req.body.name;
    let result = await pool.query(`INSERT INTO tyylilaji (tyylilaji_nimi) VALUES ('${genre}')`);
    const id = result.insertId; 
    
    res.status(201);
    //res.append('Location', 'http://192.168.1.51/authors/' + id);
    res.send({genre, id});
  
  });

app.post("/add/shelf", async function(req,res) {
    const shelf = req.body.name;
    let result = await pool.query(`INSERT INTO hylly (hylly_nimi) VALUES ('${shelf}')`);
    const id = result.insertId; 
    
    res.status(201);
    //res.append('Location', 'http://192.168.1.51/authors/' + id);
    res.send({shelf, id});
  
  });

app.post("/delete/book/", async function(req, res) {
    const id = req.body.id;

    let genreDel = await pool.query(`DELETE FROM tyylilajilista WHERE tl_teos_id = ${id};`);
    let bookDel = await pool.query(`DELETE FROM teos WHERE teos_id = ${id};`);

    
    res.send("OK");
}); 

    

var server = app.listen(PORT, function () {
  console.log(`Server listening in ${PORT}`)
})


