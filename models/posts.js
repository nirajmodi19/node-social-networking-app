var mongoose = require('mongoose');

var postSchema = new mongoose.Schema({
	body: String,
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'post'
	}],
	added_by: {
		id: {type: mongoose.Schema.Types.ObjectId, ref: 'UserDetail'},
		username: {}
	},
	user_to: String,
	date_added: {type: Date, default: Date.now},
	user_closed: Boolean,
	deleted: Boolean,
	likes: Number
});

module.exports = mongoose.model('post', postSchema);