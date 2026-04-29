const mongoose = require('mongoose');

const counter_schema = new mongoose.Schema({
    business_code:{
        type:String,
        required:true,
        unique:true,
    },
    seq:{
        type:Number,
        default:0
    }
})
module.exports = mongoose.model('Counter',counter_schema);