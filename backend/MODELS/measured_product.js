const mongoose = require('mongoose') 

const measured_product = new mongoose.Schema({
    business_code:{
        type:String
    },
    branchid:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    product_name:{
        type:String,
        required:true
    },
    product_code:{
        type:String,
        required:true
    },
    unit:{
        enum:['kilograms','grams']
    },
    quantity:{
        type:Number,
        required:true
    },
    cost_price:{
        type:Number,
        required:true
    },
    selling_price:{
        type:Number,
        required:true
    },
    date_of_inclusion:{
        type:String
    },
    updation_data:{
        type:String
    }
})

module.exports = mongoose.model('measurable-product',measured_product);