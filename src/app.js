import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import joi from "joi";
import dotenv from "dotenv";
import dayjs from 'dayjs';


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


//

//ENVIA O NOME DO USUARIO NA HORA QUE ELE ENTRA NA SALA
app.post('/participants', async(req, res)=>{
    const {name} = req.body;
    const validation = loginSchema.validate({name});
    if(validation.error) return res.sendStatus(422);
    
    // db.collection("participants").findOne({name})
    //     .then((result)=> { 
    //         if(result){
    //             return res.sendStatus(409);
    //         } else{
    //             db.collection("participants").insertOne({name, lastStatus: Date.now()})
    //                 .then(()=>{
    //                     db.collection('messages').insertOne({ 
    //                         from: name,
    //                         to: 'Todos',
    //                         text: 'entra na sala...',
    //                         type: 'status',
    //                         time: dayjs.format('HH:mm:ss')
    //                     });
    //                     res.sendStatus(201)})
    //                 .catch((err)=>res.sendStatus(500))
    //         }
    //     })           
    //     .catch(()=> res.sendStatus(500));   
    try {
        const result = await db.collection("participants").findOne({ name});
        if (result) return res.sendStatus(409);    
        await db.collection("participants").insertOne({ name, lastStatus: Date.now() });    
        
        await db.collection("messages").insertOne({
          from: name,
          to: "Todos",
          text: "entra na sala...",
          type: "status",
          time: dayjs().format("HH:mm:ss"),
        });
        res.sendStatus(201);
      } catch (error) {
        res.status(500).send(console.log(error.message));
      }
});


//lista de participantes
app.get('/participants', (req, res)=>{
    db.collection('participants').find().toArray()
        .then((participants) => res.send(participants));
});


// envia uma mensagem
app.post('/messages', (req, res)=>{

    const messageSchema = joi.object({
        from: joi.string().min(1).required(),
        to: joi.string().min(1).allow('Todos').required(),
        text: joi.string().min(1).required(),
        type: joi.string().min(1).allow('message', 'private_message').required(),
    }); 
    const {to, text, type} = req.body;
    const validation = messageSchema.validate(req.body);
    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message);
        return res.status(422).send(errors);
    }
    const {from} = req.header;
    db.collection('messages').insertOne({to, text, type, time: dayjs().format('hh:mm:ss') });
    res.send('ok');
});


//lista as mensagens enviadas
app.get('/messages', (req, res)=>{
    db.collection( 'messages').find().toArray()
        .then((messages)=>res.send(messages));
})

app.listen( PORT ,()=>{ console.log(`RUNING PORT ${PORT}`)});