var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var PORT = process.env.PORT || 3010; 
var mysql = require('mysql');

var db = process.env.DATABASE_URL || 'localhost'

var app = express();
var userArray = [];

var connection = mysql.createConnection({
  host      : 'localhost',
  user      : 'root',
  password: 'John3:16',
  database  : 'friend_Finder_db'
});

var pg = require('pg');

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use(bodyParser.json({type:'application/vnd.api+json'}));

app.listen(PORT, function(){
   console.log('app is listening on port ' + PORT);
})

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/app/public/home.html');
});

app.get('/survey', function(req, res) {
    res.sendFile(__dirname + '/app/public/survey.html');
});

app.get('/users', function(req, res){
  res.sendFile(__dirname + '/app/public/users.html');
});

app.post('/api/friends', function(req, res){
  var newUser = req.body;
  console.log('This is newUser: ', newUser);
  console.log('This is new user scores: ', newUser.scores);
  var scores = newUser.scores.join();
  var currentUsers = [];
  connection.query('SELECT id, name, scores, photo FROM users', function(err, result){
    if (err) throw err;

    for (var i = 0; i < result.length; i++) {

      console.log('These are all ids ',result[i].id);
      var loopUsers = {
        'id': result[i].id,
        'name': result[i].name,
        'photo': result[i].photo
      }
      var scoreString = result[i].scores;
      var scoreInt = scoreString.replace(/,/g,'')
      var scoreArray = [];
      for(j=0;j<scoreInt.length;j++){
        scoreArray.push(parseInt(scoreInt[j]))
      }

      loopUsers.scores = scoreArray;
      currentUsers.push(loopUsers);
      console.log(currentUsers);
    }

    var totalDif = {};
    for (k=0;k<currentUsers.length;k++){
      var num = 0;
      for(h=0;h<currentUsers[k].scores.length;h++){

        function diff(num1, num2){
          var num1 = parseInt(newUser.scores[h]);
          var num2 = currentUsers[k].scores[h];
          num += ((num1 > num2)? num1-num2 : num2-num1)

          totalDif[currentUsers[k].id] = num

          console.log('This is total difference, ', totalDif);
        }
        diff();
      }
    }

    var sortedArray = Object.keys(totalDif).sort(function(a,b){return totalDif[a]-totalDif[b]});
    console.log('this is sortedArray: ', sortedArray);
    var sortedString = sortedArray.join(' and id = ');
    var topString = sortedArray[0];
    console.log('this is sortedString: ', sortedString);

    connection.query('SELECT id, name, scores, photo FROM users WHERE id = '+topString+';', function(err, result){
      if(err) throw err;
      console.log('This is your closest match: ', result);
      res.send(result);
    });

  });


  connection.query('INSERT INTO users(name, photo, scores) VALUES("'+newUser.name+'", "'+newUser.photo+'", "'+scores+'");', function(err, result){
    if(err) throw err;
    console.log('This is result: ',result);
  });
});

app.post('/users', function(req, res){
  connection.query('select * from users', function(err, result){
    if(err) throw err;

    res.send(result);
  })
});