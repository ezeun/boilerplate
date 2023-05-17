const express = require('express'); 
const app = express(); 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
require('dotenv').config()
app.use(methodOverride('_method'))
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
var fs = require('fs');
const { cpp, python } = require('compile-run');
const { exec } = require('child_process');

var db;
MongoClient.connect(process.env.DB_URL, function(error, client){
    if(error) return console.log(error)
    db = client.db('compiler');

    // db.collection('post').insertOne({이름 : 'leeju', _id : 100}, function(error, res){
    //     console.log('저장완료');
    // });

    app.listen(process.env.PORT, function(){ 
        console.log('listening on 8080')
    });    
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



  // web compiler
  app.post('/output', function (req, res) {
    let selected_language = req.body.language;
    let inputParameters = req.body.inputArea;
    let sourcecode = req.body.codeArea;

    var backButton = `<br><br><style>body{background-color:white;}button{width:100px;height:30px;cursor:pointer;color:white;background-color:black;font-size:25px;border-radius:25px;}button:hover{background-color:green;}</style><button onClick='back()'>Back</button>
    <script>function back(){history.go(-1);}    </script>`;

    console.log("Language: "+selected_language+"\n"+sourcecode);
   
    
    if (selected_language === "C++") {
        fs.writeFile('Main.CPP', sourcecode, function (err) {
            if (err) throw err;
            console.log('Saved!');
            console.log("Inputs Passed:\n"+inputParameters);
        });

        cpp.runFile('Main.CPP', { stdin:inputParameters}, (err, result) => {
        if(err){
            console.log(err);
        }
        else{
            //res.send('<center><h1 style="color:yellow;">Output:-</h1><b style="color:white;font-size:30px;">'+result['stderr']+"<br>"+result['stdout']+"<br>Memory Usage (Bytes): "+result['memoryUsage']+"<br>CPU Usage(Micro Sec): "+result['cpuUsage']+backButton);
            res.send(result['stderr']+"<br>"+result['stdout']+"<br><br>Memory Usage (Bytes): "+result['memoryUsage']+"<br>CPU Usage(Micro Sec): "+result['cpuUsage']+backButton);
            console.log(result);
        }
        });
    }
    else if (selected_language === "Python") {
        //코드 파일과 입력 파일 생성
        //fs.writeFile('main.py', req.body.codeArea);
        //fs.writeFile('input.txt', req.body.inputArea);
        //fs.writeFile('error.txt', "");

        fs.writeFile('main.py', sourcecode, function (err) {
            if (err) throw err;
            console.log('sourceCode Saved!');
        });
        fs.writeFile('input.txt', inputParameters, function (err) {
            if (err) throw err;
            console.log('input Saved!');
            console.log("Inputs Passed:\n" + inputParameters);
        });
        //fs.writeFile('error.txt', "", function (err) {
        //    if (err) throw err;
        //    console.log('Saved!');
        //    console.log("Inputs Passed:\n" + inputParameters);
        //});
    
        //명령어 생성
        const pythonCommand = `python main.py`;
        let pythonErrorCommand = `${pythonCommand} 2> error.txt`;
    
        if (inputParameters.trim()){
            pythonErrorCommand = `${pythonCommand} < input.txt`;
        }
        //권한 변경
        //fs.chmodSync('error.txt', 0o777);

        //에러 파일 생성
        //fs.closeSync(fs.openSync('error.txt', 'w'));
    
        //에러 명령어 실행
        exec(pythonErrorCommand, (error, stdout, stderr) => {
          //에러 발생 시 에러 출력
          if (error) {
            console.error(`exec error: ${error}`);
            //const errorData = fs.readFileSync('error.txt', 'utf-8');
            //console.error(`stderr: ${errorData}`);
            //fs.unlinkSync('error.txt');
            return;
          }
          if(stderr){
            console.log(`stderr: ${stderr}`);
            return;
          }

          /*
          fs.readFile('input.txt', 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }
          
            let command = pythonCommand;
            // 파일이 비어있는지 확인
            if (data.trim() === '') {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                      console.error(`exec error: ${error}`);
                      const errorData = fs.readFileSync('error.txt', 'utf-8');
                      console.error(`stderr: ${errorData}`);
                      fs.unlinkSync('error.txt');
                      return;
                    }
            
                    console.log(`stdout: ${stdout}`);
                });
            } 
            else {
                command = `${command} < ${'input.txt'}`;
                exec(command, (error, stdout, stderr) => {
                  if (error) {
                    console.error(`exec error: ${error}`);
                    const errorData = fs.readFileSync('error.txt', 'utf-8');
                    console.error(`stderr: ${errorData}`);
                    fs.unlinkSync('error.txt'); // 에러 파일 삭제
                    return;
                  }
                  console.log(`stdout: ${stdout}`);
                });
            }
          });
          */

        /*  
          //입력 값이 없는 경우
          let command = pythonCommand;
          if (!inputParameters.trim()) {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                  console.error(`exec error: ${error}`);
                  //const errorData = fs.readFileSync('error.txt', 'utf-8');
                  console.error(`stderr: ${errorData}`);
                  //fs.unlinkSync('error.txt');
                  return;
                }
        
                console.log(`stdout: ${stdout}`);
            });
          }
          //입력값이 있는 경우
          else {
            console.log('hi');
            command = `${command} < ${'input.txt'}`;
            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.error(`exec error: ${error}`);
                //const errorData = fs.readFileSync('error.txt', 'utf-8');
                console.error(`stderr: ${errorData}`);
                //fs.unlinkSync('error.txt'); // 에러 파일 삭제
                return;
              }
              console.log(`stdout: ${stdout}`);
            });
          }
        */
          res.send(`${stderr}<br>${stdout}<br><br>${backButton}`);
          
          //파일 삭제
          //fs.unlinkSync('main.py');
          //fs.unlinkSync('input.txt');
          //fs.unlinkSync('error.txt');
        });
    }

    // else if (selected_language === "Python") {
    //     const sourcecode = req.body.codeArea;
    //     let inputParameters = req.body.inputArea;
    
    //     fs.writeFile('Main.py', sourcecode, function (err) {
    //       if (err) throw err;
    //       console.log('Saved!');
    //       console.log("Inputs Passed:\n"+inputParameters);
    //     });
    
    //     python.runFile('Main.py', { stdin:inputParameters}, (err, result) => {
    //       if(err){
    //           console.log(err);
    //       }
    //       else{
    //           res.send(result['stderr']+"<br>"+result['stdout']+"<br><br>Memory Usage (Bytes): "+result['memoryUsage']+"<br>CPU Usage(Micro Sec): "+result['cpuUsage']+backButton);
    //           console.log(result);
    //       }
    //   });    
    // }
    else {
        res.send('<center><h1 style="color:yellow;">Output:-</h1><h1 style="color:white;font-size:50px;">' + "Something Went Wrong / Wrong Language Chosen");
    }

})