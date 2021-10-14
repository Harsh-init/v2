const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

const User = require('../models/User');
const Main = require('../models/Main');

// uuid

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

router.get('/t',ensureAuthenticated, async(req,res)=>{
    res.send(await User.find({activated_at: {$lt: req.user.activated_at}})
  .sort({activated_at:-1})
  .limit(30))
  // let a=await User.find({date: {$gt: 1633873177675}})
  // .sort({date:-1})
  // .limit(30)
  // res.send(a)

})
router.get('/h',ensureAuthenticated, async(req,res)=>{
  let a=[]
  a.push(nonActivated(req.user,'p3',5000))
  User.bulkWrite(a).then(reso => {
                  console.log(reso)
                })
  res.send('done')
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
      p1: {price:5000,  reach:{up:8,down:10}},
      p2: {price:10000, reach:{up:10,down:12}},
      p3: {price:20000, reach:{up:15,down:20}},
      p4: {price:50000, reach:{up:20,down:30}},
      p5: {price:100000,reach:{up:20,down:30}},
      p6: {price:150000,reach:{up:20,down:30}},
      p7: {price:200000,reach:{up:20,down:30}},
  }
  const package_reach=packages[package].reach
  const package_price = packages[package].price;
  if (typeof package_price == 'undefined') {
    return res.send("Package invalid ")
  }
  if (req.user.amount_invested >= package_price) {
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
  //
    let bulkUpdates=[]

  //
  // = = = = = = = DISTRIBUTION 1 ( Referal / 42% ) = = = = = = = = = 
  // Creating referal updates for Bulk write 
  let package_topay = package_price - req.user.amount_invested
  // If user Alreay have a package than minus it from package 
  let refpct = [25, 5, 3, 2, 2, 2, 1, 1, 0.5, 0.5]
  // Refferal percentage 
  let refUpdates = []
  referrers.forEach((ref, i) => {
    let team ="active_team."+i
    let share=refpct[i] / 100 * package_topay
    let refup = {
      updateOne: {
        filter: {
          _id: ref
        },
        update: {
          $inc: {
            referal_inc: share,
            total_inc:share,
            total_bal:share
          },
          $push: {
            [team]:{
              name:req.user.name,
              uuid:req.user.uuid,
              idu:req.user._id,
              income:share,
              ref_id:req.user.referrer._id,
              extra: "index:"+i+"/s:"+selectedPackage+package_topay,
              times:Date.now()

            }
          }
        }
      }
    }
    refUpdates.push(refup)
  });
  bulkUpdates.push(...refUpdates)
     // putting referal updates in array for bulk operation
  // End of  = = = = = DISTRIBUTION 1 ( Referal /42% ) - - - - - - - 

  if(req.user.activated){
    console.log('Updating')

  }else{
   let userUpdate=nonActivated(req.user,selectedPackage,package_topay,package_reach);
   bulkUpdates.push(userUpdate)

   let uplineUpdates=await findup30(req.user,selectedPackage,package_topay,package_reach)
   console.log(uplineUpdates)
   bulkUpdates.push(...uplineUpdates)

   console.log(bulkUpdates)

   res.send(await User.bulkWrite(bulkUpdates))
  }


})

async function findup30(user,selectedPackage,package_topay,package_reach){
  let up30= await User.find({activated:true})
  .sort({activated_at:-1})
  .limit(30)

  console.log('---- -  -  found up30 ', up30)
  let uplineUpdates=[]
  up30.forEach((upuser,index) =>{
      console.log('inside for each --  - ')
      // first 22 user get 1% sahre other gets 0.5% 
      // because in javascript index start from 0 , so we put =(equal sign) 
      let sharepct = index >= 22 ? 0.5 : 1
      let share = sharepct / 100 * package_topay 

      let up_update = {
        updateOne: {
          filter: {
            _id: upuser._id
          },
          update: {
            $inc: {
              downline_inc: share ,
              total_inc: share ,
              total_bal: share 
            },
            $push: {
              down_line: {
                name: user.name,
                uuid: user.uuid,
                idu:  user._id,
                income: share,
                extra: "index:"+index+"/reach:"+upuser.reach.down+"s:"+selectedPackage+package_topay,
                
                times:Date.now()
              }
            }
          }
        }
      }
      // checking if user is eligible for share with its reach power
      // going to check its down power for this method 
      if (upuser.reach.down <= index) {
        // changeit if not eligible
        console.log('not eligible'+upuser.name)
        let cantget_update={ updateOne: {filter: {_id: upuser._id},
          update: {
            $inc: {
              cantget_inc: share ,
            },
            $push: {
              cantget_history: {
                name: user.name,
                uuid: user.uuid,
                idu:  user._id,
                income: share,
                extra: "index:"+index+"/reach:"+upuser.reach.down+"s:"+selectedPackage+package_topay,
                times:Date.now()
              }
            }
          }
        }}
        uplineUpdates.push(cantget_update)
      }else{

      uplineUpdates.push(up_update)

      }

  });
  console.log(' pushing updates ',uplineUpdates)
  return uplineUpdates
}


function nonActivated(user,selectedPackage,package_topay,package_reach){
  let  tref = user.name.substring(0, 3).toLowerCase() + Math.floor(1000 + Math.random() * 9000)

  let dot = 'packages.'+selectedPackage

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
            reach:{
              up:package_reach.up ,
              down:package_reach.down
            } ,
            last_package:selectedPackage,
            [dot]: true
          }
    }
  }

  console.log(JSON.stringify(temp2))
  return temp2
}

router.post('/users/packag', ensureAuthenticated, (req, res) => {
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




