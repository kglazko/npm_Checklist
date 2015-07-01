/**
 * Module dependencies.
 */

var http = require('http');
var express = require('express'),
    routes = require('./routes');

//Nano Module Config
var nano = require('nano')('http://localhost:5984');
//Specify Database to use each time
var db = nano.use('versions');
// Configuration
const PORT = 3000;
const AUDIENCE = "http://localhost:" + PORT;

var app = express();

var rev="";

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  //app.use(express.csrf());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.locals.pretty = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.post('/auth', routes.auth(AUDIENCE));

//Post a new version to the Database
app.post('/version_create' ,function(req, resp){
var version=req.body.ff_version;
/*The second parameter phone is the id we are explicitly specifying*/
db.insert({version:version,qa_sign:false},version,function(err, body) {
if (err) {
if(err.message === 'no_db_file') {
           // create database and retry
           return nano.db.create("versions", function () {
            insert_version(req,res);
           console.log("ARLOOO");
            });
          }
console.log (err.message);
return;
}
console.log("Version was created sucessfully %s %s", version);
});
req.session.ver = req.body.ff_version;
resp.redirect('/');
}
);

//Complete Q.A. Signoff
app.post('/qa_signoff', function(req,resp){
  var sign_off = "True";
  db.get(req.session.ver, { revs_info: true }, function(err, body) {
  if (!err)
    rev = String(body._rev);
    console.log(rev);
  db.insert({_id: req.session.ver, _rev: body._rev, qa_sign: true },function(err, body) {
  if (!err) {
    console.log("Successfully modified");
    req.session.qa_signoff = sign_off;
    console.log(req.session.qa_signoff);
    resp.redirect('/');
  }
  else {
    console.log(err);
  }
});
});
});

//Logout Code
app.get('/logout', routes.logout);

var server = http.createServer(app);
server.listen(PORT, function() {
    console.log("Express server listening on port %d in %s mode", PORT, app.settings.env);
});

module.exports = server;
