const mongoose = require('mongoose');

const sales_schema = mongoose.Schema({
    branch_code:{
        type:String,
        required:true
    },
    items:[
        {
            product_code:{
                type:String,
                required:true,
            },
            quantity:{
                type:Number,
                required:true,
            },
            total_cost:{
                type:Number,
                required:true
            }
        }
    ],
    issueDate:{
        type:String,
        required:true
    },
    total_sale_cost:{
        type:Number,
        required:true
    },
    total_profit:{
        type:Number,
        required:true
    },
    sales_code:{
        type:String,
        required:true,
        unique:true
    },
    idempotency_key:{
        type:String,
        required:true,
        unique:true
    }
})

module.exports = mongoose.model('Sales_Data',sales_schema);