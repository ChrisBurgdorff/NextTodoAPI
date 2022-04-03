const db = require('../models');
const ROLES = db.ROLES;
const User = db.user;

checkDuplicateUser = (req, res, next) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Email already in use."
      });
    }
    next();
  }).catch(err => {
    res.status(500).send({
      message: "Something went wrong"
    });
  });
};

checkRolesExist = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: "Role does not exist." 
        });
        return;
      }
    }    
  }
  next();
};

const verifySignup = {
  checkDuplicateUser: checkDuplicateUser,
  checkRolesExist: checkRolesExist
};
module.exports = verifySignup;