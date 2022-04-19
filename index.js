var express = require('express');
var app = express();
var cors = require('cors');
var bcrypt = require('bcryptjs');
var appConfig = require('./config');
var jwt = require('jsonwebtoken');

const db = require('./models');
const Op = db.Sequelize.Op;
const { Todo, User, Role } = require('./models');
//const Role = require('./models/Role');
const { verifySignUp, verifySignup, authJwt } = require("./middleware");
const e = require('express');

/*
Installed packages: express, mysql2, sequelize, sequelize-cli, path, fs, cors, jsonwebtoken, bcryptjs

Using the Sequelize CLI:
sequelize init
then set up config.json variables
then set up models

Tables will be created and synced automatically
*/

//Middleware
app.use(express.json());
app.use(cors(appConfig.CORS_OPTIONS));
//app.use(express.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

//Test route
app.get('/', function(req, res) {
  res.send('hhhii');
});

//Connect to DB and start server
db.sequelize.sync({force: true}).then((req) =>{
  app.listen(process.env.port || 3001, function() {
    initDb();
    console.log("Listening on " + (process.env.port || 3001));    
  });
});

//Initialize Basic DB Data
function initDb() {
  Role.create({name: "user"}).catch(err => {
    console.log(err.message);
  });
  Role.create({name: "admin"}).catch(err => {
    console.log(err.message);
  });

  Todo.belongsTo(User);
  User.hasMany(Todo);
  User.belongsToMany(Role, {through: "user_roles"});
  Role.belongsToMany(User, {through: "user_roles"});
}

//TODO Routes
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

app.get('/api/user/:id/todo', (req,res) => {
  Todo.findAll({
    where: { 
      UserId: req.params.id
    }
  }).then((todos) => {
    res.send(todos);
  }).catch(err => {
    if (err) {
      console.log(err);
      res.send({message: err.message})
    }
  });
});

app.post('/api/todo', (req, res) => { //TODO Add setUser(with incoming User ID)
    Todo.create({
      description: req.body.description,
      UserId: req.body.UserId,
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
      todo_id: req.params.id
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
    where: { todo_id: id }
  }).then(todo => {
    res.send(todo);
  }).catch(err => {
    res.send(err);
  });
});

//HELPER FUNCTIONS
function getAllPropertyNames(obj) {
  var result = [];
  while (obj) {
    result.push.apply(result, Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }
  return result;
}

//AUTH Routes Auth
app.post('/api/auth/register', 
  [
    verifySignup.checkDuplicateUser,
    verifySignup.checkRolesExist
  ], 
  (req, res) => {
  User.create({
    email: req.body.email,
    name: req.body.name,
    password: bcrypt.hashSync(req.body.password, 10)   
  }).then(user => {
      user.addRole([1]).then(() => {
        return res.send({ message: "User was registered successfully!" });
      }).catch((err) => {
        return res.status(500).send({message: err.message});
      });
    })
  .catch(err => {
    console.log(err);
    return res.status(500).send({ message: err.message });
  });
});

app.post('/api/auth/login', (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then(user => {
    if (!user) {
      return res.status(404).send({message: "User not found."});
    }
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.send(401).send({
        accessToken: null,
        message: "Invalid Username or password"
      });
    }
    var token = jwt.sign({id: user.id}, appConfig.JWT_SECRET, {
      expiresIn: 86400
    });
    var authorities = [];
    user.getRoles().then(roles => {
      for (let i = 0; i < roles.length; i++) {
        authorities.push("ROLE_" + roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user.id,
        email: user.email,
        name: user.name,
        roles: authorities,
        accessToken: token
      });
    });
  }).catch(err => {
    res.status(500).send({message: err.message});
  });
});

app.post('/api/auth/logout', (req, res) => {
  try {
    res.clearCookie("TodoJWT");
    res.status(200).send({message: "Successfully Logged Out"});
  } catch (err) {
    res.send({message: err.message});
  }
});


app.get('/api/user/:id',  (req, res) => {
  User.findAll({
    where: { 
      id: req.params.id
    }
  }).then(user => {
    return res.status(200).send(user);
  }).catch(err =>{
    res.send(err);
  });
});

app.get('/api/currentuser', (req, res) =>{
  
  let token = req.headers["x-access-token"];
  if (!token) {
    return res.status(200).send({
      message: "No token provided"
    });
  }
  jwt.verify(token, appConfig.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(200).send({
        message: "Token invalid"
      });
    }
    //console.log()
    const userId = decoded.id;
    User.findAll({
      where: { 
        id: userId
      }
    }).then(user => {
      return res.status(200).send(user);
    }).catch(err =>{
      res.status(500).send(err.message);
    });
  });
});


//Authentication Test Routes
app.get("/api/test/all", (req, res) => {
  res.status(200).send({
    message: "Reached unauthenticated endpoint"
  });
});

app.get("/api/test/user", [authJwt.verifyToken], (req, res) => {
  res.status(200).send({
    message: "Reached authenticated endpoint"
  }).catch(err => {
    res.status(500).send({
      message: err.message
    });
  });
});

app.get("/api/test/admin",
  [authJwt.verifyToken, authJwt.isAdmin],
  (req, res) => {
    res.status(200).send({
      message: "Reached admin endpoint"
    }).catch(err => {
      res.status(500).send({
        message: err.message
      });
    });
});