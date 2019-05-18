'use strict'
var express = require('express')
var app = express()
var bodyParser = require('body-parser');
var cors = require('cors')
app.use(cors())
app.use(bodyParser.json());
app.use(cors({origin: 'http://lauri.kk4.fi/homeLibrary'}));

var pool = require('./database');
const PORT = process.env.PORT || 5000

app.get('/books', async function (req, res) {
  let result = await pool.query('SELECT * FROM teosListaus');
  res.send(result);
});
app.get("/book/:id", async function(req, res) {
  const id = req.params.id;
  let result = await pool.query(`SELECT * FROM teosTiedot WHERE ID = ${id}`);
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
});

app.get("/book/edit/:id", async function(req, res) {
  const id = req.params.id;
  console.log(req.params.id);
  
  let result = await pool.query(`SELECT * FROM BookEditQuery WHERE id = ${id}`);
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
});
app.get('/authors', async function (req, res) {
  let result = await pool.query('SELECT tekija_id AS id, tekija_nimi AS name FROM tekija');
  res.send(result);
});
app.get('/categories', async function (req, res) {
  let result = await pool.query('SELECT kategoria_id AS id, kategoria_nimi AS name FROM kategoria');
  res.send(result);
});
app.get('/shelves', async function (req, res) {
  let result = await pool.query('SELECT hylly_id AS id, hylly_nimi AS name FROM hylly');
  res.send(result);
});
app.get('/shelves/:id', async function (req, res) {
  const id = req.params.id;
  let result = await pool.query(`SELECT hylly_id AS id, hylly_nimi AS name FROM hylly WHERE hylly_id = ${id};`);
  res.send(result);
});
app.get('/genres', async function (req, res) {
  let result = await pool.query('SELECT tyylilaji_id AS id, tyylilaji_nimi AS name FROM tyylilaji');
  res.send(result);
});
app.get('/book/genres/:id', async function (req, res) {
  const id = req.params.id;
  let result = await pool.query(`SELECT tl_id AS id, tyylilaji_nimi AS name 
  FROM tyylilajilista INNER JOIN tyylilaji ON tl_tyylilaji_id = tyylilaji_id WHERE tl_teos_id = ${id};`);
  res.send(result);
});
app.post('/book/remove/genre', async function (req, res) {
  const id = req.body.id;
  console.log("remove id ", id);
  let result = await pool.query(`DELETE FROM tyylilajilista WHERE tl_id = ${id};`);
  res.status(200);
  res.send({message: "Removed genre with id: " + id});
});
app.post('/book/add/genre', async function (req, res) {
  const id = req.body.id;
  const g = req.body.genres;
  addGenre(id, g);

  res.status(200);
  res.send({message: "Added genres for book with id: " + id});
});

app.get('/author/:id', async function (req, res) {
    const id = req.params.id;
    let author = await pool.query(`SELECT tekija_nimi AS name FROM tekija WHERE tekija_id = ${id}`);
    let books = await pool.query(`SELECT * FROM summary WHERE tekija_id = ${id}`);
    
    if (!author.length) {
      res.status(404);
      res.send(
        {
          "code": 404,
          "message": "Resource not found.",
          "description": "Author with id = " + id + " does not exist."
        });
    } else {
      res.status(200);
      res.send({author, books});
    }
});

app.post("/add/book", async function(req,res) {
    const name = req.body.name;
    const kategoria = req.body.categoryId
    const laji = req.body.alaji;
    const isbn = req.body.isbn;
    const tekija = req.body.authorId;
    const kuvaus = req.body.description;
    const vuosi = req.body.year;
    const lisatiedot = req.body.info;
    const hylly = req.body.shelfId;
    const tila = req.body.status;
    
    
    let result = await pool.query(`INSERT INTO teos (teos_nimi, teos_kategoria_id, teos_aineistolaji_id, teos_isbn, teos_tekija_id, teos_kuvaus, teos_vuosi, teos_lisatiedot, teos_hylly_id, teos_tila_id) VALUES 
    ('${name}','${kategoria}','${laji}','${isbn}','${tekija}','${kuvaus}','${vuosi}','${lisatiedot}','${hylly}','${tila}');`);
    
    const id = result.insertId;
    res.status(201);
    res.send({id, name});
    addGenre(id, req.body.genre);
});

async function addGenre(id, g) {
  for (let i = 0; i < g.length; i++) {
    let result = await pool.query(`INSERT INTO tyylilajilista (tl_teos_id, tl_tyylilaji_id) VALUES (${id}, ${g[i]});`);
  }
}

app.post("/add/author", async function(req,res) {
    const name = req.body.name;
    let result = await pool.query(`INSERT INTO tekija (tekija_nimi) VALUES ('${name}')`);
    const id = result.insertId;
    res.status(201);
    res.send({name, id});
});
app.post("/update/shelf", async function(req,res) {
  const name = req.body.name;
  const id = req.body.id;
  let result = await pool.query(`UPDATE hylly SET hylly_nimi = '${name}' WHERE hylly_id = '${id}'`);
  
  console.log(result);
  res.status(201);
  res.send({name, id});

});
app.post("/update/author", async function(req,res) {
  const name = req.body.name;
  const id = req.body.id;
  let result = await pool.query(`UPDATE tekija SET tekija_nimi = '${name}' WHERE tekija_id = '${id}'`);
  
  console.log(result);
  res.status(200);
  res.send({name, id});
});
app.post("/update/book", async function(req,res) {
  const name = req.body.name;
  const category = req.body.category;
  
  const id = req.body.id;
  const isbn = req.body.isbn;
  const author = req.body.author;
  const description = req.body.description;
  const year = req.body.year;
  const info = req.body.info;
  const shelf = req.body.shelfId;
  const status = req.body.status;
  let result = await pool.query(`UPDATE teos SET teos_nimi = '${name}',
                                                 teos_kategoria_id = '${category}',
                                                 teos_isbn = '${isbn}',
                                                 teos_tekija_id = '${author}',
                                                 teos_kuvaus = '${description}',
                                                 teos_vuosi = '${year}',
                                                 teos_lisatiedot = '${info}',
                                                 teos_hylly_id = '${shelf}',
                                                 teos_tila_id = '${status}'                                                 
   WHERE teos_id = '${id}'`);

  res.status(200);
  res.send({name, id, category, isbn, author, description, year, info, shelf, status});
});
app.get('/book/pictures/:id', async function (req, res) {
  const id = req.params.id;
  let result = await pool.query(`SELECT kuva_id AS id, kuva_tiedosto AS name FROM kuva WHERE kuva_teos_id = '${id}';`);
  res.send(result);
});
app.post('/book/add/picture/', async function (req,res) {
  const id = req.body.id;
  const file = req.body.file;
  let result = await pool.query(`INSERT INTO kuva (kuva_teos_id, kuva_tiedosto) VALUES ('${id}', '${file}');`)
  const newId = result.insertId;
  res.send({message: "Picture " + file + " added with id =  " + newId});
});
app.post('/book/remove/picture', async function (req, res) {
  const id = req.body.id;
  console.log("remove id", id);
  let result = await pool.query(`DELETE FROM kuva WHERE kuva_id = '${id}';`);
  res.send({message: "Removed image with id=" + id});
});
app.post("/add/genre", async function(req,res) {
    const name = req.body.name;
    
    let result = await pool.query(`INSERT INTO tyylilaji (tyylilaji_nimi) VALUES ('${name}')`);
    const id = result.insertId; 
    
    res.status(201);
    res.send({name, id});
  
});
app.post("/add/shelf", async function(req,res) {
    const name = req.body.name;
    let result = await pool.query(`INSERT INTO hylly (hylly_nimi) VALUES ('${name}')`);
    const id = result.insertId; 
    res.status(201);
    res.send({name, id});
});
app.post("/delete/book/", async function(req, res) {
    const id = req.body.id;

    let genreDel = await pool.query(`DELETE FROM tyylilajilista WHERE tl_teos_id = ${id};`);
    let bookDel = await pool.query(`DELETE FROM teos WHERE teos_id = ${id};`);
    
    res.status(200);
    res.send({id});
}); 

var server = app.listen(PORT, function () {
  console.log(`Server listening in ${PORT}`)
})


