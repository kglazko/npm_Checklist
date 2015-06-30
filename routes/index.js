var https = require('https'),
    verify = require('browserid-verify')();

/*
 * GET home page.
 */

exports.index = function(req, resp){
  resp.render('index', { title: 'Release Management Checklist', user: req.session.email, csrf: req.session._csrf, version: req.session.ver, qa_sign : req.session.qa_signoff});
  //if (version) {
 // req.session.version = version;
 // resp.render('index', {version: req.session.version});
 // }
};

exports.version_declare = function(req, resp) {
  if (req.body.ff_version) {
    req.session.ver = req.body.ff_version;
    //database(req, resp);
    console.log( "Setting version to: " + req.body.ff_version);
    return resp.redirect('/');
  }

  else {
    console.log("error error");
    console.log(req.body.ff_version);
  }

  function database(req, res){
    var version=req.body.ff_version;
/*The second parameter phone is the id we are explicitly specifying*/
console.log("I made it here!!!");
  db.insert({version:version,qa_sign:false},version,function(err, body) {
    if (err) {
  if(err.message === 'no_db_file') {
            // create database and retry
           return nano.db.create("versions", function () {
            insert_version(req,res);
            console.log("ARLOOO");
          });
         }
  console.log("Error creating version or version already exists");
console.log (err.message);
return;
}
console.log("Version was created sucessfully %s %s", version);
});

}
};

exports.auth = function (audience) {

  return function(req, resp){
    console.info('verifying with persona');

    var assertion = req.body.assertion;

    verify(assertion, audience, function(err, email, data) {
      if (err) {
        // return JSON with a 500 saying something went wrong
        console.warn('request to verifier failed : ' + err);
        return resp.send(500, { status : 'failure', reason : '' + err });
      }

      // got a result, check if it was okay or not
      if ( email ) {
        console.info('browserid auth successful, setting req.session.email');
        req.session.email = email;
        return resp.redirect('/');
      }

      // request worked, but verfication didn't, return JSON
      console.error(data.reason);
      resp.send(403, data)
    });
  };

};

exports.logout = function (req, resp) {
  req.session.destroy();
  resp.redirect('/');
};
