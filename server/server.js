require('dotenv').config() // to load variables from the .env file
const express = require('express')
const app = express()
const cors = require('cors')
const parser = require('body-parser')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const session = require('express-session')


var connection = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
})


connection.connect(function(err){
    if(err) {
        console.log("error while reaching database !!")
        return
    }
    console.log("Connected as id: "+connection.threadId)
})

app.use(parser.json())
app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POSt"],
    credentials: true
}))
app.use(cookieParser())
app.use(parser.urlencoded({extended:true}))


app.use(session({
    key:"userID",
    secret:"authsystem",
    resave:  false,
    saveUninitialized: false,
    cookie: {
       maxAge:60000
    }
}))

app.get('/', (req, res) => {
    res.send("Server working")
})

app.get('/login', (req, res) => {
    console.log(req.session.user)
    if(req.session.user){
        res.send({
            loggedIn: true,
            data: req.session.user
        })
    }else{
        res.send({
            loggedIn: false
        })
    }
})

app.post('/login', (req, res) => {
    const email = req.body.email
    connection.query('SELECT * FROM `users` WHERE `email`= ?', [email], function(error, result, fields){
        if(result.length > 0){
            bcrypt.compare(req.body.password, result[0].password, function(err, equal) {
                if(equal){
                    req.session.user=result
                    console.log(req.session.user)
                    res.status(200).send({
                        message:"Successful login",
                        errors:[]
                    })
                }else{
                    res.status(200).send({
                        errors:["Wrong password"]
                    })
                }
            });
        }else{
            res.status(200).send({
                errors:["This email doesn't exist"]
            })
        }
    })
})


app.post('/register', (req, res) => {
    const email = req.body.email
    console.log(email)
    connection.query('SELECT * FROM `users` WHERE `email`= ?', [email], function(error, result, fields){
        if(error) throw error
        if(result.length === 0){
            bcrypt.hash(req.body.password, 10, function(error, hash) {
                if(error) throw error
                connection.query('INSERT INTO `users` (email, password) VALUES(?,?)',[email, hash], function(error,result,fields){
                    if(error) throw error
                    res.status(200).send( {
                        errors: [],
                        message: "Registration secceded"
                    } )
                })
            });
        }else{
            res.status(200).send({
                errors:["Email address already exist"] 
            })
        }
    })
})

app.listen(process.env.PORT, () => {
    console.log("server listening on port "+process.env.PORT)
})