const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

const User = require('../models/User');
const Main = require('../models/Main');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

router.get('/a',(req,res)=>{
	User.find({},{password:0,_id:0},function(err,usr){
		console.log('sending')
    Main.findOne({name:"Main-development"},function(errr,main){
      console.log(main)
      res.render('all',{user:usr,main:main})

    })
	})
	
})

router.get('/t',async(req,res)=>{

  let a=await User.find({date: {$gt: 1633873177675}})
  .sort({date:-1})
  .limit(30)
  res.send(a)

})
router.get('/g',async(req,res)=>{
  const newMain= new Main({
    name:'Main-development',

  })
  newMain.save()
  .then(user => {
     res.send(user)
   })
  .catch(err => console.log(err));
  
  
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

router.post('/users/package', ensureAuthenticated, async(req, res) => {
  if(!req.body.package){
    return res.send("No Package Send")
  }
  // Verifying User Package
  const {package} = req.body; 
  const selectedPackage = package;
  const packages = {
      p1: 5000,
      p2: 10000,
      p3: 20000,
      p4: 50000,
      p5: 100000,
      p6: 150000,
      p7: 200000,
  }

  const package_price = packages[package];
  if (typeof package_price == 'undefined') {
    return res.send("Package invalid ")
  }
  if (req.user.amount_invested >= sPackage) {
    return res.send('This package seems already activated')
  }
  // End Of Verifying User Package


  // Get referrers array 
  let referrers = []
  const iterate = (obj) => {
    Object.keys(obj).forEach(key => {
      console.log(key)
      if (key == '_id') {
        referrers.push(obj[key])
      }
      if (typeof obj[key] === 'object') {
        iterate(obj[key])
      }
    })
  }
  if (req.user.referrer) {
    iterate(JSON.parse(JSON.stringify(req.user.referrer)))
  }
  // End Of Referres array

  // = = = = = = = INCOME 1 ( Referal ) = = = = = = = = = 
  // Creating referal updates for Bulk write 
  let package_topay = package_price - req.user.amount_invested
  // If user Alreay have a package than minus it from package 
  let refpct = [25, 5, 3, 2, 2, 2, 1, 1, 0.5, 0.5]
  // Refferal percentage 
  let refupdates = []
  referrers.forEach((ref, i) => {
    let refup = {
      updateOne: {
        filter: {
          _id: ref
        },
        update: {
          $inc: {
            referal_bal: refpct[i] / 100 * package_topay
          }
        }
      }
    }
    refupdates.push(refup)
  });
  // End of  = = = = = INCOME 1 ( Referal ) - - - - - - - 

  if(req.user.activated){
    console.log('Updating')

  }else{
    nonActivated(req.user)
  }


})

function findup30(user){
  User.find({activated_at: {$lt: user.activated_at}})
  .sort({activated_at:-1})
  .limit(30)
}


function nonActivated(user,selectedPackage,package_topay){
  let  tref = user.name.substring(0, 3).toLowerCase() + Math.floor(1000 + Math.random() * 9000)
  let temp2 = {
    updateOne: {
          filter: {
            _id: user._id
          },
          update: {
            activated: true,
            activated_at: Date.now(),
            referalcode: tref,
            amount_invested: user.amount_invested + package_topay,
            packages: {
                [selectedPackage]: true
              }
          }
    }
  }
}

router.post('/users/package', ensureAuthenticated, (req, res) => {
  const {
    activated,
    name,
    amtinvt,
    email,
    date
  } = req.user
  console.log(req.user)
  const user = {
    activated,
    name,
    email,
    date
  }
  // check if payement received 
  const {package} = req.body;

  let referrers = []
  const iterate = (obj) => {
    Object.keys(obj).forEach(key => {
      console.log(key)
      if (key == '_id') {
        referrers.push(obj[key])
      }
      if (typeof obj[key] === 'object') {
        iterate(obj[key])
      }
    })
  }
  if (req.user.referrer) {
    iterate(JSON.parse(JSON.stringify(req.user.referrer)))
  }

  const selectedPackage = package;
  const packages = {
    p1: 5000,
    p2: 10000,
    p3: 20000,
    p4: 50000
  }
  const sPackage = packages[package];



  console.log(referrers)

  if (typeof sPackage == 'undefined') {

    res.send('Please select a package , or maybe this package is invalid')
  } else if (amtinvt >= sPackage) {

    res.send('This package seems already activated')
  } else {
    let rPac = sPackage - amtinvt
    let refin = [25, 5, 3, 2, 2, 2, 1, 1, 0.5, 0.5]
    let op = []
    referrers.forEach((ref, i) => {
      let o = {
        updateOne: {
          filter: {
            _id: ref
          },
          update: {
            $inc: {
              refbal: refin[i] / 100 * rPac
            }
          }
        }
      }
      op.push(o)
    });
    console.dir(JSON.stringify(op))
    User.findOne({
      email: email
    }, (err, data) => {
      if (err) {
        console.log(err)
      } else {
        if (data.activated) {
          console.log('already activated')

          if (data.packages[selectedPackage]) {
            console.log('Package already activated')
            res.send('Package already activated')
          } else {
            data.packages[selectedPackage] = true
            data.amtinvt += rPac
            User.bulkWrite(op).then(reso => {
              console.log(reso)
            })
            data.save((err, updata) => {
              if (err) {
                console.log(err)
              } else {
                console.log('data update', updata)
                let tms = [0, 25, 30, 33, 35, 37, 39, 40, 41, 41.5, 42]
                let ms = tms[referrers.length]
                let osd = rPac - ms / 100 * rPac
                Main.updateOne({
                    _id: '61577f0896f1bec93e500717'
                  }, {
                    $inc: {
                      totinvt: rPac,
                      ourbal: osd
                    }
                  },
                  function(errr, resp) {
                    if (errr) {
                      console.log(errr)
                    } else {
                      console.log(resp)
                      console.log('data update', updata)
                      res.send('Activated selected package :' + sPackage)

                    }
                  })
              }
            })
          }
        } else {
          data.activated = true;
          data.packages[selectedPackage] = true
          data.amtinvt += rPac
          var tref = data.name.substring(0, 3).toLowerCase() + Math.floor(1000 + Math.random() * 9000)
          data.referalcode = tref;

          // User find 30 start here 
          let upf = []
          User.find({
              activated: true
            }, {}, {
              sort: {
                _id: -1
              },
              limit: 30
            },
            function(err, upusers) {
              if (err) {
                console.log(err)
              } else {
                //1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22
                upusers.forEach((upuser, ix) => {
                  let ixx = ix > 22 ? 0.5 : 1

                  let uf = {
                    updateOne: {
                      filter: {
                        _id: upuser._id
                      },
                      update: {
                        $inc: {
                          othbal: ixx / 100 * rPac
                        },
                        $push: {
                          dwline: {
                            idu: req.user._id,
                            name:req.user.name,
                            amt: ixx / 100 * rPac
                          }
                        }
                      }
                    }
                  }
                  upf.push(uf)
                });

                let bk = op.concat(upf)
                console.log(JSON.stringify(bk))


                User.bulkWrite(bk).then(reso => {
                  console.log(reso)
                })

                data.save((err, updata) => {
                  if (err) {
                    console.log(err)
                  } else {

                    let tms = [0, 25, 30, 33, 35, 37, 39, 40, 41, 41.5, 42]
                    let ms = tms[referrers.length]
                    let osd = rPac - ms / 100 * rPac

                    Main.updateOne({
                        _id: '61577f0896f1bec93e500717'
                      }, {
                        $inc: {
                          totinvt: rPac,
                          ourbal: osd
                        }
                      },
                      function(errr, resp) {
                        if (errr) {
                          console.log(errr)
                        } else {
                          console.log(resp)
                          console.log('data update', updata)
                          res.send('Activated your id' + updata.referalcode + ' and  selected package ' + sPackage)
                        }
                      })

                  }
                })
              }
            }) //userr 30 find end here



        }



      }
    })

  }
})

function updateMain(req,res){

  Main.updateOne({ _id: '61577f0896f1bec93e500717'}, {
      $inc: {
        totinvt: rPac,
        ourbal: osd
      }
    },function(err, resp) {
      if (err) {
        console.log(err)
      } else {
        console.log(resp)
        console.log('data update', updata)
        res.send('Activated your id' + updata.referalcode + ' and  selected package ' + sPackage)
      }
    })
}


module.exports = router;
//




