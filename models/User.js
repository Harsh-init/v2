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
  activated_at:{
    type:Date
  },
    updated_at:{
    type:Date
  },
  last_package:{
    type:String
  },
  packages:{
    p1:{type:Boolean,default:false},
    p2:{type:Boolean,default:false},
    p3:{type:Boolean,default:false},
    p4:{type:Boolean,default:false}

  },
  amount_invested:{
    type:Number,
    default:0
  },
  referal_inc:{
     type:Number,
      default:0
  },
  upline_inc:{
    type:Number,
    default:0
  },
    downline_inc:{
    type:Number,
    default:0
  },
    total_inc:{
    type:Number,
    default:0
  },
    total_bal:{
    type:Number,
    default:0
  },
  holdbal:{
    type:Number,
    default:0
  },
  down_line:{
    type:Array,
    default:[]
  },
  up_line:{
    type:Array,
    default:[]
  },
  active_team:{
    type:Array,
    default:[[],[],[],[],[],[],[],[],[],[]]
  },
  
  update_history:{
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
  reach:{
    up:{type:Number,default:0},
    down:{type:Number,default:0},
  },
  uuid:{
    type:Number,

  },
  date: {
    type: Date,
    default: Date.now
  }

});

const User = mongoose.model('User', UserSchema);

module.exports = User;




