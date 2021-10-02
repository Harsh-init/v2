const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  activated:{
    type:Boolean,
    default:false
  },
  packages:{
    p1:{type:Boolean,default:false},
    p2:{type:Boolean,default:false},
    p3:{type:Boolean,default:false},
    p4:{type:Boolean,default:false}

  },
  amtinvt:{
    type:Number,
    default:0
  },
  refbal:{
    type:Number,
    default:0
  },
  othbal:{
    type:Number,
    default:0
  },
  dwline:{
    type:Array,
    default:[]
  },
  referrer:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'

  },

  referalcode:{
    type:String,
    default:'none'
    
  },
  date: {
    type: Date,
    default: Date.now
  }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;




