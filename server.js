if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const db = require('./database')
const initializePassport = require('./passport-config')
  initializePassport(passport)
  
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(methodOverride('_method'))
  
  app.get('/', (req, res) => {
    const cb = (results) => {
        try {
            res.render('index.ejs', { name: req.user.name , events: results })
        } catch {
            res.render('index.ejs', { name: null, events: results})
        }
    }
    db.query('select * from events', (err, results) => {
        cb(results)})
})
  
  app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }))
  
  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10)
      db.query('insert into Users(name, password, email, role) values (\''+req.body.name+'\', \''+hashedPassword+'\',\''+req.body.email+'\', \''+ req.body.role+'\');')
      res.redirect('/login')
    } catch {
      res.redirect('/register')
    }
  })
  
  app.delete('/logout', (req, res, next) => {
    req.logOut((err) => {
      if (err) {
        return next(err)
      }
      res.redirect('/')
    })
  })

  app.get('/post-event', checkAuthenticated, (req, res) => {
    res.render('post-event.ejs')
  })

  app.post('/post-event', checkAuthenticated, (req, res) => {
    try {
        db.query('insert into events(event_name, location, date, coord_name, coord_email) values (\''+req.body.event_name+'\', \''+req.body.location+'\',\''+req.body.date+'\',\''+req.user.name+'\',\''+req.user.email+'\');')
        res.redirect('/')
    } catch {
        res.render('post-event.ejs')
    }
  })

  app.get('/register-event', checkAuthenticated, (req, res) => {
    res.render('register-event.ejs', {eventid: req.url.split('eventid=')[1]})
  })

  app.post('/register-event', checkAuthenticated, (req, res) => {
    const cb = (results) => {
        db.query('insert into participants(uid, eid) values (\''+results[0].id+'\',\''+req.body.eid+'\');')
        res.redirect('/')
    }
    db.query('select id from users where email = \''+req.user.email+'\'', (req, results) => {
        cb(results)
    }) 
  })
  
  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
  
    res.redirect('/login')
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/')
    }
    next()
  }
  
  app.listen(3000)