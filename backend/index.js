const dotenv = require('dotenv');
dotenv.config({path:'./config.env'})
const express = require('express');
const mongoose = require('mongoose');
const auth_router = require('./ROUTES/auth_routes');
const owner_router = require('./ROUTES/owner_routes');
const customer_router = require('./ROUTES/customer_routes');
const branch_router = require('./ROUTES/branch_routes');
const product_router = require('./ROUTES/product_route');
const credit_router = require('./ROUTES/credit_router');
const sales_router = require('./ROUTES/sales_routes');
const ml_routes = require('./ROUTES/ml_routes');
const cors = require('cors');
const {getFestivalFlag} = require('./ETL/etl_utils');
console.log(getFestivalFlag(new Date('2026-01-01')));
console.log(getFestivalFlag(new Date('2026-01-05')));
console.log(process.env.PORT);
const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true
}));

// handle preflight requests



app.use(express.json());
app.use('/msme',auth_router);
app.use('/msme',owner_router);
app.use('/msme',customer_router);
app.use('/msme',branch_router);
app.use('/msme',product_router);
app.use('/msme',credit_router);
app.use('/msme',sales_router);
app.use('/api/v1/ml', ml_routes);
console.log('Connecting to:', process.env.connection_string); // add this

mongoose.connect(process.env.connection_string,{
}).then(()=>{
     console.log('connection succeeded with database');
    console.log('DB name:', mongoose.connection.name); 
    console.log('connection succeeded with database')}).catch((error)=>console.log('db error occured',error.message))


app.listen(process.env.PORT,()=>console.log('server connected on the port-> ',process.env.PORT));