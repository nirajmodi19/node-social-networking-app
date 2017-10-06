var mongoose = require('mongoose');

var postCommentSchema = new mongoose.Schema({
	post_body: String,
	posted_by: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
		username: String
	},
	posted_to: String,
	date_added: {type: Date, default: Date.now},
	removed: Boolean,
});

module.exports = mongoose.model('post_comment', postCommentSchema);