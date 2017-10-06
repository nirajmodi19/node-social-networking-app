var mongoose = require('mongoose');

var likeSchema = new mongoose.Schema({
	username: String,
	post_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'post';
	}
});

module.exports = mongoose.model('like', likeSchema);