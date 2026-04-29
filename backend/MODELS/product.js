const mongoose = require('mongoose');
const product_schema = mongoose.Schema({
    product_name:{
        type:String,
        required:true,
    },
    product_code:{
        type:String,
        required:true,
    },
    cost_price:{
        type:Number,
        required:true,
    },
    selling_price:{
        type:Number,
        required:true,
    },
    quantity:{
        type:Number,
        required:true
    },
    branch_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Branches',
        requires:true,
    },
    inclusion_date:{
        type:String,
        required:true
    },
    updation_date:{
        type:String,
    }
})

module.exports = mongoose.model('Products_Data',product_schema)