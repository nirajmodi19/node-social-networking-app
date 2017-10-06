const express       = require('express');
const bodyParser    = require('body-parser');
const mongoose      = require('mongoose');
const passport      = require('passport');
const LocalStrategy = require('passport-local');
const session       = require('express-session');
const ObjectId 		= require('mongodb').ObjectID;

mongoose.connect('mongodb://localhost/Social', {useMongoClient: true});

const User 			= require('./models/user.js');
const UserDetail 	= require('./models/userDetails.js');
const Post 			= require('./models/posts.js')

var port 			= process.env.PORT || 3000
var app 			= express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: "I am loving node",
	resave: true,
	saveUninitialized: true
}));

app.use(express.static(__dirname+'/public'));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	next();
});

//@@@@@@@@@@@@@@@@@@@@@@@@
//INDEX ROUTES
//@@@@@@@@@@@@@@@@@@@@@@@@

app.get('/', (req, res) => {
	res.render('index');
});

app.get('/register', (req, res) => {
	res.render('register');
});

app.post('/register', (req, res) => {
	if(req.body.password !== req.body.password2) {
		console.log('Password must be same');
		res.redirect('/register');
	}

	var newUser = new User({username: req.body.username});
	User.register(newUser, req.body.password, (err, user) => {
		if(err) {
			return console.log(err);
		}
		var name = req.body.name;
		var user_id = {
			id: user._id,
			username: req.body.username
		};
		var newUserDetails = {name, user_id};
		UserDetail.create(newUserDetails, (err, data) => {
			if (err) {
				console.log(err);
			} else {
				passport.authenticate('local')(req, res, () => {
					res.redirect('/home');
				});
			}
		});
	});
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.post('/login',passport.authenticate('local', {
		successRedirect: '/home',
		failureRedirect: '/login'
	}), (req, res) => {
});

app.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

//@@@@@@@@@@@@@@@@@@@@@@@@
//HOME ROUTES
//@@@@@@@@@@@@@@@@@@@@@@@@

app.get('/home', isLoggedIn, (req, res) => {
	if(req.user) {
		id = req.user.username;
		UserDetail.findOne({'user_id.username': id}).populate("posts").exec((err, newUser) => {
			if(err) {
				console.log(err);
			} else {
				//res.locals.userDetail = newUser;
				res.render('home/home', {newUser});
			}
		});
	}	
});

app.post('/home', isLoggedIn, (req, res) => {
	if(req.body.post_text) {
		var body = req.body.post_text;
		//var added_by = {id: req.user._id, username: req.user.username};
		var user_to = '';
		var user_closed = 0;
		var deleted = 0;
		var likes = 0;

		var newPost = {body, user_to, user_closed, deleted, likes};

		Post.create(newPost, (err, data) => {
			if(err) {
				console.log(err);
			} else {
				var query = {'user_id.username': req.user.username};
				UserDetail.findOneAndUpdate(query, {$inc: {'num_posts': 1}}, (err, user) => {
					if(err) {
						console.log(err);
					} else {
						id = new ObjectId(data._id);
						user.posts.push(id);
						user.save();
						res.redirect('/home');
					}
				});	
			}
		});
	}	
});

//@@@@@@@@@@@@@@@@@@@@@@@@
//Abhi naam decide nahi hua hai ;-)
//@@@@@@@@@@@@@@@@@@@@@@@@

app.listen(port, () => {
	console.log('Server Started');
});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()) {
		return next();
	} 
	res.redirect('/login');
}