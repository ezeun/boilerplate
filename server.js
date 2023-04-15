const express = require('express'); 
const app = express(); 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.ecwllpn.mongodb.net/?retryWrites=true&w=majority', function(error, client){
    if(error) return console.log(error)
    db = client.db('compiler');

    // db.collection('post').insertOne({이름 : 'leeju', _id : 100}, function(error, res){
    //     console.log('저장완료');
    // });

    app.listen(8080, function(){ 
        console.log('listening on 8080')
    });    
});

app.get('/pet', function(req, res){ 
    res.send('펫 용품 쇼핑 페이지입니다.')
});

app.get('/beauty', function(req, res){
    res.send('뷰티 용품 쇼핑 페이지입니다.')
});  

app.get('/', function(req, res){
    res.render('index.ejs'); 
});  

app.get('/write', function(req, res){
    res.render('write.ejs'); 
});  

app.post('/add', function(req, res){
    res.send('전송완료')
    console.log(req.body)
    
    console.log(req.body.code)
    console.log(req.body.input)
    console.log(req.body.output)

    db.collection('counter').findOne({name : '게시물 개수'}, function(error, result){
        console.log(result.totalPost); 
        var postNum = result.totalPost;

        db.collection('post').insertOne({_id : postNum + 1, 코드 : req.body.code, 입력 : req.body.input, 출력 : req.body.output}, function(){
            console.log('저장완료');
            db.collection('counter').updateOne({name : '게시물 개수'}, { $inc : {totalPost : 1}}, function(error, result){
                if(error) return console.log(error)
            })
        });
    });
});

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(error, result){ 
        console.log(result);
        res.render('list.ejs', { posts : result}); 
    }); 
});  

app.delete('/delete', function(req, res){
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(error, result){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다'});
    })
});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(error, result){ 
        console.log(result)
        res.render('detail.ejs', { data : result}); 
    })
}); 

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(error, result){ 
        console.log(result)
        res.render('edit.ejs', { data : result}); 
    })
}); 

app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set : { 코드: req.body.code, 입력: req.body.input, 출력: req.body.output}}, function(error, result){
        console.log('수정완료')
        res.redirect('/list')
    });

});

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs'); 
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/')
});

app.get('/fail', function(req, res){
    res.render('fail.ejs'); 
}); 

app.get('/mypage', 로그인했니, function(req, res){
    console.log(req.user);
    res.render('mypage.ejs', {사용자 : req.user}); 
}); 

function 로그인했니(req, res, next){ 
    if (req.user){ 
        next() 
    } else{
        res.send('로그인 안하셨는데요?')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id', 
    passwordField: 'pw', 
    session: true,
    passReqToCallback: false, 
  }, function (입력한아이디, 입력한비번, done) {
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' }) 
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));

  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  passport.deserializeUser(function (아이디, done) { 
    db.collection('login').findOne({id : 아이디}, function(error, result){
        done(null, result)
    })
  }); 