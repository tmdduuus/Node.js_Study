const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(express.urlencoded({extended: true})) 
app.set('view engine', 'ejs');
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.use('/public', express.static('public'));

app.use('/shop', require('./routes/shop.js') );
app.use('/board/sub', require('./routes/board.js') );

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

var db;
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if(에러) {return console.log(에러)}
    
    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening on 8080');
    });
})

// app.listen(8080, function(){
//     console.log('listening on 8080');
// });
  
app.get('/pet', function(req, res){
    res.send('펫용품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/beauty', function(req, res){
    res.send('화장품 쇼핑할 수 있는 페이지입니다.');
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.get('/write', function(req, res) { 
    res.sendFile(__dirname +'/write.html')
  });

app.post('/add', function(req, res){
    res.send('전송완료');
    db.collection('counter').findOne({name : '게시물갯수'}, function(에러, 결과){
        console.log(결과.totalPost);
        var 총게시물갯수 = 결과.totalPost;
        var 저장할거 = { _id : 총게시물갯수 + 1 , 제목 : req.body.title, 작성자 : req.user._id, 날짜 : req.body.date};

        db.collection('post').insertOne(저장할거, function(에러, 결과){
            console.log('저장완료');

            // counter라는 콜렉션에 있는 totalPost 항목도 1 증가시켜야함
            db.collection('counter').updateOne({name : '게시물갯수'}, { $inc : {totalPost : 1} }, function(에러, 결과){
                // 기능 실행
                if(에러){return console.log(에러)}
            })
        });

    });   
})

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, result){
        console.log(result);
        res.render('list.ejs', { posts : result });
    });
})

app.delete('/delete', function(req, res){
    console.log('삭제요청들어옴');
    console.log(req.body);
    req.body._id = parseInt(req.body._id);

    var 삭제할데이터 = { _id : req.body._id, 작성자 : req.user._id }

    db.collection('post').deleteOne(삭제할데이터, function(에러, 결과){
        console.log('삭제완료');
        if(에러) {console.log(에러)}
        res.status(200).send({ message : '성공했습니다' });
    })
})

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id) }, function(에러, 결과){
        console.log(결과);
        res.render('detail.ejs', { data : 결과 });
    })
})

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        console.log(result);
        res.render('edit.ejs', {post : result});
    })
})

app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id : parseInt(req.body.id) }, { $set : { 제목:req.body.title, 날짜:req.body.date}}, function(err, result){
        console.log("수정완료")
        res.redirect('/list')
    })
})

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret :'비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/')
});

app.get('/mypage', 로그인했니, function(req, res){
    console.log(req.user);
    res.render('mypage.ejs', {사용자 : req.user})
});


function 로그인했니(req, res, next){
    if(req.user){
        next()
    }else {
        res.send('로그인 안하셨는데요?')
    }
}

passport.use(new LocalStrategy({
    usernameField : 'id',
    passwordField : 'pw',
    session : true,
    passReqToCallback : false,
}, function(입력한아이디, 입력한비번, done){
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({id : 입력한아이디}, function(에러, 결과){
        if(에러) return done(에러)
        if(!결과) return done(null, false, {message : '존재하지않는 아이디요'})
        if(입력한비번 == 결과.pw){
            return done(null, 결과)
        } else {
            return done(null, flase, {message : '비번틀렸어요'})
        }
    })
}));

passport.serializeUser(function(user, done){
    done(null, user.id)
});

passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id : 아이디}, function(에러, 결과){
        done(null, 결과)
    })
});

app.post('/register', function(req, res){
    db.collection('login').insertOne( { id : req.body.id, pw : req.body.pw }, function(에러, 결과){
        res.redirect('/');
    } )
})

app.get('/search', (req, res) => {
    var 검색조건 = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: '제목'
                }
            }
        },
        { $sort : { _id : 1 } },
        { $limit : 10 }, // 상위 10개
        { $project : { 제목: 1, _id: 0, score: { $meta: "searchScore" } } }
    ]
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
        console.log(결과)
        res.render('search.ejs', {posts : 결과})
    })
})


