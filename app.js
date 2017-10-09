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
const Post 			= require('./models/posts.js');
const Comment   	= require('./models/comments.js');

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
				//console.log(newUser);
				res.render('home/home', {newUser});
			}
		});
	}	
});

app.post('/home', isLoggedIn, (req, res) => {
	if(req.body.post_text) {
		var body = req.body.post_text;
		var added_by = {id: req.user._id, username: req.user.username};
		var user_to = '';
		var user_closed = 0;
		var deleted = 0;
		var likes = 0;

		var newPost = {body, added_by, user_to, user_closed, deleted, likes};

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
	console.log('Post cannot be empty');
	res.redirect('/home');	
});

//@@@@@@@@@@@@@@@@@@@@@@@@
//Comment Routes
//@@@@@@@@@@@@@@@@@@@@@@@@

app.get('/comments/:id', isLoggedIn, (req, res) => {
	var post_id = req.params.id;
	Post.findOne({'_id': post_id}).populate("comments").exec((err, returnedPost) => {
		if(err) {
			console.log(err);
		} else {
			res.render('comments/comments', {returnedPost});
		}
	});
});

app.post('/comments/:id', isLoggedIn, (req, res) => {
	var post_id = req.params.id;
	if(req.body.post_body){
		var post_body = req.body.post_body;
		var posted_by = {id: req.user._id, username: req.user.username};
		// Post.findById(post_id, (err, foundPost) => {
		// 	if(err) {
		// 		console.log(err);
		// 	} else {
		// 		console.log(foundPost);
		// 		var posted_to = foundPost.added_by.username;
		// 	}
		// });
		var posted_to = 'none';
		var removed = 0;
		var newPost = {post_body, posted_by, posted_to, removed};

		Comment.create(newPost, (err, data) => {
			if(err) {
				console.log(err);
			} else {
				Post.findOne({'_id': post_id}).populate("comments").exec((err, returnedPost) => {
					if(err) {
						console.log(err);
					} else {
						console.log(returnedPost);
						id = new ObjectId(data._id);
						returnedPost.comments.push(id);
						returnedPost.save();
						res.render('comments/comments', {returnedPost});
					}
				});
			}
		});
	}
	///res.render('comments/comments');
});



//@@@@@@@@@@@@@@@@@@@@@@@@
//Listening to ports
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