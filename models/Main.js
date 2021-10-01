const mongoose = require('mongoose');

const MainSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  totinvt:{
    type:Number,
    default:0
  },
  ourbal:{
    type:Number,
    default:0
  },
  holdbal:{
    type:Number,
    default:0
  },

  date: {
    type: Date,
    default: Date.now
  }

});

const Main = mongoose.model('Main', MainSchema);

module.exports = Main;




