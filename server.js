const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(express.urlencoded({extended: true})) 
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb+srv://jmy9937:solux2023@cluster0.8eugxab.mongodb.net/?retryWrites=true&w=majority', function(에러, client){
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
    db.collection('counter').findOne({name : '게시물갯수'}, function(err, result){
        console.log(result.totalPost);
        var 총게시물갯수 = result.totalPost;

        db.collection('post').insertOne( { _id : 총게시물갯수 + 1, 제목 : req.body.title, 날짜 : req.body.date } , function(){
            console.log('저장완료');
            db.collection('counter').updateOne({name : '게시물갯수'}, {$inc: {totalPost:1}}, function(err, result){
                if(err){return console.log(err);}
            });
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
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(에러, 결과){
        console.log('삭제완료');
        res.status(200).send({ message : '성공했습니다' });
    }) 
})

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id) }, function(에러, 결과){
        console.log(결과);
        res.render('detail.ejs', { data : 결과 });
    })
})