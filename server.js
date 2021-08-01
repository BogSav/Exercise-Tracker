const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

require('dotenv').config();

app.use(bodyParser.urlencoded({extended : false}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(
  process.env["MONGO_URI"],
  {useNewUrlParser : true, useUnifiedTopology : true}
);

const userSchema = new mongoose.Schema({
  username : {type : String, unique : true},
  count : Number,
  log: [Object]
});

let User = mongoose.model("User", userSchema);

app.post("/api/users", (req, res) => {
  let document = User({username : req.body.username, count : 0, log : []});
  document.save((err, data) => {
    if(err)
      return console.error(err);
    return res.json(data);
  })
});

function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

app.post("/api/users/:_id/exercises", (req, res) => {
  let paramDate;

  if(req.body.date == null)
    paramDate = new Date();
  else if(!isValidDate(new Date(req.body.date)))
    return res.send("Eroare conversie data");
  else
    paramDate = new Date(req.body.date);

  const log = {
    description : req.body.description,
    duration : Number(req.body.duration),
    date : paramDate
  };
  User.findById(req.params._id, (err, user) => {
    if(err)
      return console.error(err);

    user.log.push(log);
    user.count = user.log.length;

    user.save((err, data) => {
      if(err)
        return console.error(err);
      return res.json({
        _id : req.params._id,
        username : user.username,
        date : log.date.toDateString(),
        duration : log.duration,
        description : log.description
      });
    });
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, users) => {
    if(err)
      return console.error(err);
    return res.send(users);
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id, (err, user) => {
    if(err)
      return console.error(err);
    let object = {
      _id : user._id,
      username : user.username,
      count : user.count,
      log : user.log
    }
    if(req.query.to != null)
      object["log"] = object["log"].filter(obj => obj["date"] <= new Date(req.query.to));
    if(req.query.from != null)
      object["log"] = object["log"].filter(obj => obj["date"] >= new Date(req.query.from));
    if(req.query.limit != null)
      object["log"] = object["log"].slice(0,Number(req.query.limit));
    console.log(object);
    return res.json(object);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
