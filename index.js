const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

mongoose.connect(process.env.MONGOOSE_URI)

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  count: {type: Number, default: 0},
  log: [
    {
      description: {type: String, required: true},
      duration: {type: Number, required: true},
      date: {type: Number}
    }
  ]
})

userModel = mongoose.model('users', userSchema);

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  const data = new userModel({username: req.body.username});
  const toSend = await data.save()
  res.json({username: toSend.username, _id: toSend['_id']})
})

app.get('/api/users', async (req, res) => {
  const data = await userModel.find({}).select('_id username').exec()
  res.json(data)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const date = new Date(req.body.date || Date.now()).getTime()
  const data = await userModel.findByIdAndUpdate(req.params['_id'], {$push: {log: {description: req.body.description, duration: req.body.duration, date: date}}, $inc: {count: 1}})
  res.json({
    username: data.username,
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: new Date(date).toDateString(),
    _id: req.params['_id']
  })
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const data = await userModel.findById(req.params['_id'])
  if (req.query.from) {
    const from = new Date(req.query.from).getTime()
    data.log = data.log.filter((el) => el.date >= from)
  }

  if (req.query.to) {
    const to = new Date(req.query.to).getTime()
    data.log = data.log.filter((el) => el.date <= to)
  }

  if(req.query.limit){
    data.log = data.log.slice(0, req.query.limit)
  }

  let ret = {
    username: data.username,
    count: data.count,
    _id: data['_id'],
    log: data.log.map((elm) => {
      return {
        description: elm.description,
        duration: elm.duration,
        date: new Date(elm.date).toDateString()
      }
    })
  }
  
  res.json(ret)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
