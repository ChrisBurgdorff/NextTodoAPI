var express = require('express');
var app = express();
var cors = require('cors');
var appConfig = require('./config');

const db = require('./models');
const { Todo, User } = require('./models');

/*
Installed packages: express, mysql2, sequelize, sequelize-cli, path, fs, cors

Using the Sequelize CLI:
sequelize init
then set up config.json variables
then set up models

Tables will be created and synced automatically
*/

//Middleware
app.use(express.json());
app.use(cors(appConfig.CORS_OPTIONS));
app.use(express.urlencoded({ extended: true }));

//Test route
app.get('/', function(req, res) {
  res.send('hhhii');
});

//Connect to DB and start server
db.sequelize.sync().then((req) =>{
  app.listen(process.env.port || 3001, function() {
    console.log("Listening on " + (process.env.port || 3001));
  });
});

app.get('/api/todo', (req, res) => {
  Todo.findAll().then((todos) => {
    res.send(todos);
  }).catch(err => {
    if (err) {
      console.log(err);
      res.send(err);
    }
  });
});

app.post('/api/todo', (req, res) => {
  console.log(req.body);
    Todo.create({
      description: req.body.description,
      done: req.body.done || false
    }).then(todo => {
      res.send(todo);
    }).catch(err => {
      res.send(err);
    });
});

app.delete('/api/todo/:id', (req, res) => {
  Todo.destroy({
    where: {
      id: req.params.id
    }
  }).then(todo => {
    res.json({message: "Success"});
  }).catch(err => {
    res.send(err);
  });
});

app.get('/api/todo/:id', (req, res) => {
  Todo.findAll({
    where: { 
      id: req.params.id
    }
  }).then(todo => {
    res.send(todo);
  }).catch(err =>{
    res.send(err);
  });
});

app.put('/api/todo/:id', (req, res) => {
  const id = req.params.id;
  Todo.update(req.body, {
    where: { id: id }
  }).then(todo => {
    console.log("RESPONSE FROM PUTT");
    console.log(todo);
    res.send(todo);
  }).catch(err => {
    console.log("RESPONSE FROM PUT ERROR");
    console.log(err);
    res.send(err);
  });
});
