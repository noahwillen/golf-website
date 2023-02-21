const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const db = require('./database')

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    db.query('select * from Users where email = \''+email+'\'', async (err, res, fields) => {
      const user = res[0]
      if (user == null) {
        return done(null, false, { message: 'No user with that email' })
      }
      try {
        if (await bcrypt.compare(password, user.password)) {
          return done(null, user)
        } else {
          return done(null, false, { message: 'Password incorrect' })
        }
      } catch (e) {
        return done(e)
      }
    })

  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    db.query('select * from Users where id = \''+id+'\'', (err, res, fields) => {
      const user = res[0]
      return done(null, user)
    })
  })
}

module.exports = initialize