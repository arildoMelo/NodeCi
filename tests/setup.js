jest.setTimeout(30000);
require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;//we are telling mongose to use Node js Promise implementation
mongoose.connect(keys.mongoURI, {useMongoClient: true});//just to avoit deprecation warning

