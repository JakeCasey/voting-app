
require('dotenv').load();

var express = require('express');
var app = express();
var path = require('path');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var User = require('./models/Users');
var Poll = require('./models/Polls');
var session = require('express-session');
var flash = require('connect-flash')


//body parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies



//database login and debugging
var mongoose = require('mongoose');

// for creating id's for individual voting options

mongoose.connect(process.env.DB_HOST);
mongoose.set('debug', true)

//passport and session setup
app.use(session({secret : 'secret'}));
app.use(passport.initialize());
app.use(passport.session());



//passport interaction with facebook auth servers
passport.use(new Strategy({
    clientID: process.env.ID,
    clientSecret: process.env.SECRET,
    callbackURL:  'https://voting-app-jakecasey.c9users.io/login/facebook/callback',
    profileFields: ['email', 'name']
  },
  function(accessToken, refreshToken, profile, done) {
        //find or create a new user
        User.findOne({facebook : profile.id}, function(err, user){
            if(err){ return done(err);}
            if(!user){
                
                var newUser = new User();
                
                newUser.name = profile.name.givenName + ' ' + profile.name.familyName;
                newUser.email = profile.emails[0].value;
                newUser.facebook = profile.id;
                
                newUser.save(function(err){
                    if(err){return err;}
                    
                    return done(err, newUser);
                })
            }
                else {
                    return done(err, user);
                }
            })
        })
  );
  
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
  
// use ejs for view engine and templating 
app.set('view engine', 'ejs');

//allow access to views
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/'));

//using flash messaging for error reporting to user
app.use(flash());
app.use(function(req, res, next){
    res.locals.success = req.flash('succ');
    res.locals.errors = req.flash('error');
    next();
});

//home
app.get('/', function(req,res){
    Poll.find({}, function(err, polls){
        if(err){return err}
        res.render('index', {polls : polls, messages: req.flash()});
    })
    
})

//logout
app.get('/logout', function(req,res){
  
  req.logout();
  req.flash('success', "You've been logged out successfully.")
  res.redirect('/'); 
    
});

//login
app.get('/login', passport.authenticate('facebook', { scope: [ 'email' ] }));

//facebook login callback for user authentication
app.get('/login/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    req.flash('success', "You've been logged in successfully.")
    res.redirect('/');
  });

    

//show new poll page
app.get('/newpoll', function(req, res){
  //make sure user is authenticated
  if(req.isAuthenticated()){
      res.render('newpoll');
  }
  else {
      req.flash('err', 'Please log in before creating a new poll.');
      res.redirect('/');
  }
   
    
});  

//for form submission post. Uses bodyparser.
app.post('/newpoll', function(req, res){
    console.log(req.body)
    var test = true;

       for (var key in req.body){
       if(req.body[key] == ''){
           res.end('please fill out all fields')
           return test = false;
            }
        }
     
        
      if(test){
        var newPoll = new Poll({
            name : req.body.name,
            created_by_id : req.user._id
        });
        
        delete req.body.name
        
        for( var key in req.body){
            console.log(req.body[key]);
            newPoll.options.push({option: req.body[key], votes: 0})
        }
      
        newPoll.save(function(err, poll){
            if(err){return err}
            console.log(poll + ' was created')
        })
    
        req.flash('success', 'Poll has been created successfully.')
        res.redirect('/')
      }
});


// displays a poll with a certain id.
app.get('/polls/:pollid', function(req, res){
    
    var id = req.params.pollid;
    var votedon = false;
  
  // if a user is authenticated give them the option to vote on it, if they haven't already.
  if(req.isAuthenticated()){
    
    Poll.findOne({ _id: id}, function(err, poll){
       if (err){return err};
    
    User.findOne({_id : req.user._id}, function(err, user){
        if(err){return err;}
       
        for(var i in user.voted_on){
           if (user.voted_on[i] == id){
               votedon = true;
           } 
       }
         res.render('poll', {poll : poll, options : poll.options, votedon : votedon})
    })
       
    });
    }
    else {
        // else display just the votes but no option for non-authenticated user to vote.
         Poll.findOne({ _id: id}, function(err, poll){
            if (err){return err};
    
         res.render('poll', {poll : poll, options : poll.options, votedon : true})
    })
        
        
    }
   

});


//path for voting on an option.
app.get('/polls/:pollid/:optionid/vote', function(req, res){
    
   
    
    var optionid = req.params.optionid
    var pollid = req.params.pollid
    

    //adds a pollid to the user model, for vote authentication        
    User.findOne({_id : req.user._id }, function(err, user){
        if(err){return err;}
        
        user.voted_on.push(pollid);
        
        user.save(function(err, user){
            if(err){return err;}
            console.log("user has voted on "+ pollid);
        })
        
    })
    
    // finds a poll, then the option of that poll by ID, incrementing the vote of that option, then saves the poll again.
    // redirects user back to same poll.
    Poll.findOne({_id : pollid }, function(err, poll){
        if(err){return err;}
        var obj = poll.options.id(optionid);
        
        obj.votes++;
        
        poll.save(function(err, poll){
            if(err) {return err;}
            res.redirect('/polls/'+ req.params.pollid);
        })
    
    });
    
    
    
});

// where a user can view their own polls.
app.get('/mypolls', function(req, res){
    
    
    
    
    if(req.isAuthenticated()){
      var userID = req.user._id;
    Poll.find({created_by_id : userID}, function (err, polls){
       if (err){return err} 
        res.render('mypolls', {polls: polls, messages: req.flash()})
        
    });
  }
  else {
      req.flash('err', 'Please log in to see your polls.');
      res.redirect('/')
  }
    
    

    
});


//delete path for user.
app.get('/polls/:pollid/delete', function(req,res){
    var pollid = req.params.pollid
    // searches for a poll using the poll id, then deletes it from the collection.
    Poll.findOne({_id : pollid}, function(err, poll){
        if(err){ return err;}
        
        poll.remove(function(){
            var userID = req.user._id;
            Poll.find({created_by_id : userID}, function (err, polls){
            if (err){return err} 
            req.flash('success', 'This poll was removed successfully.');
            res.render('mypolls', {polls: polls, messages: req.flash()})
        
    });
        })
    })
    
});

//queries DB for users to check for user insertion
app.get('/testforinsertion', function(req, res){
   Poll.find({}, function(err, user){
       if(err){
           return err;
       }
       res.send(user);
   })
    
});



app.listen(process.env.PORT, function(){
    console.log("Running")
});