import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import joi from "joi";
import dotenv from "dotenv";

const app = express();
app.use(express.json());
app.use(cors());
const  PORT = 5000;
dotenv.config();
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient.connect()
    .then(()=> db = mongoClient.db())
    .catch(err => console.log(err.message));

//fazendo os schemas do joi
const loginSchema = joi.object({
    name: joi.string().min(1).required()
});

const messageSchema = joi.object({
    from: joi.string().min(1).required(),
    to: joi.string().min(1).required(),
    text: joi.string().min(1).required(),
    type: joi.string().min(1).required(),
    //time: joi.string().min(1).required()
});


//envia nome do usuario
app.post('/participants', (req, res)=>{
    const {name} = req.body;
    const validation = loginSchema.validate({name});
    console.log(validation.error);
    if(validation.error) return res.sendStatus(422);
    
    db.collection("participants").findOne({name})
        .then((result)=> { 
            if(result){
                return res.sendStatus(409);
            } else{
                db.collection("participants").insertOne({name, lastStatus: Date.now()})
                    .then(()=>{res.send('ok')})
                    .catch((err)=>sendStatus(500))
            }
        })           
        .catch(()=> res.sendStatus(500));   
});


//lista de participantes
app.get('/participants', (req, res)=>{
    db.collection('participants').find().toArray()
        .then((participants) => res.send(participants));
});


// envia uma mensagem
app.post('/messages', (req, res)=>{
    const {to, text, type} = req.body;
    db.collection('messages').insertOne({to, text, type});
    res.send('ok');
});


//lista as mensagens enviadas
app.get('/messages', (req, res)=>{
    db.collection( 'messages').find().toArray()
        .then((messages)=>res.send(messages));
})

app.listen( PORT ,()=>{ console.log(`RUNING PORT ${PORT}`)});