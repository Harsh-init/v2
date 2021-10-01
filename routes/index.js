const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

const User = require('../models/User');
// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

router.get('/a',(req,res)=>{
	User.find({},{password:0,_id:0},function(err,usr){
		console.log('sending')
		res.render('all',{user:usr})
	})
	
})

router.get('/t',async(req,res)=>{
  console.log(await User.find().sort({_id:-1}).limit(2))
  res.end('g')
})

router.get('/del',(req,res)=>{
  User.deleteMany({},function(err,usr){
    console.log('deleting')
    res.send(usr)
  })
  
})

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>{
  const { activated , name , packages ,amtinvt,referalcode,referrer, email , date }=req.user
 
  const user ={ activated , name , packages ,amtinvt,referalcode,referrer, email , date }

  res.render('dashboard', {
    user: user
  })
});

router.post('/users/package',ensureAuthenticated,(req,res) =>{
  const { activated , name , email , date }=req.user
 
  const user = { activated , name , email , date }
  // check if payement received 
  const {package}=req.body;
  const referrers=JSON.parse(req.body.referrers)

  const selectedPackage=package;
  const packages={p1:5000,p2:10000,p3:20000}
  const sPackage=packages[package];

  console.log(referrers)
  let refin=[25,5,3,2,2,2,1,1,0.5,0.5]
  let op=[]
  referrers.forEach( (ref,i)=> {
    let o={
      updateOne:{
        filter:{_id:ref},
        update:{$inc:{refbal:refin[i] / 100 * sPackage}}
      }
    }
    op.push(o)
  });
  console.dir(JSON.stringify(op))

  if(typeof sPackage == 'undefined'){
      res.send('Please select a package , or maybe this package is invalid')
  }else {
    User.findOne({email:email},(err,data)=>{
      if (err) {
        console.log(err)
      } else {
        if(data.activated){
          console.log('already activated')

          if (data.packages[selectedPackage]) {
            console.log('Package already activated')
            res.send('Package already activated')
          } else {
            data.packages[selectedPackage]=true
            data.amtinvt+=sPackage
             User.bulkWrite(op).then(reso=>{
            console.log(reso)
          })
            data.save((err,updata)=>{
            if(err){console.log(err)}
              else {
                console.log('data update',updata)
                 res.send('Activated selected package :'+sPackage)                    
              }
          })
          }
        }else {
          data.activated=true;
          data.packages[selectedPackage]=true
          data.amtinvt+=sPackage
          var tref=data.name.substring(0,3).toLowerCase()+Math.floor(1000+ Math.random()*9000)
          data.referalcode=tref;

          User.bulkWrite(op).then(reso=>{
            console.log(reso)
          })
          data.save((err,updata)=>{
            if(err){console.log(err)}
              else {
                console.log('data update',updata)
                res.send('Activated your id'+updata.referalcode+' and  selected package '+sPackage)
              }
          })
          
        }

       

      }
    })
    
  }
})

module.exports = router;
//




