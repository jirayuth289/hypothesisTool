var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var diagramSchema = new Schema({
    name: { type: String, required: true },
    diagramDetail: { type: String, required: true },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Diagram', diagramSchema);