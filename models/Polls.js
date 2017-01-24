var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollSchema = new Schema({

    name: String,
    created_by_id: String,
    options: [{option: String, votes: Number}]
})

var Poll = mongoose.model('Poll', PollSchema);

module.exports = Poll;