const mongoose = require('mongoose');

var userDetailSchema = new mongoose.Schema({
	name: {
		type:String,
		required: true
	},
	signup_date: {
		type: Date,
		default: Date.now
	},
	profile_pic: {
		type: String,
		default: 'https://image.flaticon.com/icons/svg/417/417777.svg'
	},
	num_posts: {
		type: Number,
		default: 0
	},
	num_likes: {
		type: Number,
		default: 0
	},
	user_closed: Boolean,
	friend_array: Array,
	user_id: {
		id: {type: mongoose.Schema.Types.ObjectId,ref: 'User'},
		username: String
	},
	posts: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'post'
	}]
});

module.exports = mongoose.model('UserDetail', userDetailSchema);