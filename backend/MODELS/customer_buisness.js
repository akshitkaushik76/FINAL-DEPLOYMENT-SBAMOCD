const mongoose = require('mongoose');

const customer_business_schema = new mongoose.Schema({
    customer_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Customer_data',
        required:true
    },
    business_code:{
        type:String,
        required:true
    },
    customer_code:{
        type:String,
        required:true
    },
    enrolled_At:{
        type:Date,
        default:Date.now
    }
})

customer_business_schema.index({customer_id:1,business_code:1},{unique:true});

module.exports = mongoose.model('customer_business_rel',customer_business_schema);