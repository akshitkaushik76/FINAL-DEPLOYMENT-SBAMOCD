const mongoose = require('mongoose');

const credit_count_schema = new mongoose.Schema({
    date_customer_code:{
        type:String,
        required:true,
        unique:true
    },
    seq:{
        type:Number,
        default:0
    }
})

module.exports = mongoose.model('credit_count',credit_count_schema);