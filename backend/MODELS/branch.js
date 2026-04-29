const mongoose = require('mongoose');

const branch_Schema = mongoose.Schema({
    branch_name:{
        type:String,
        required:true,
        unique:true
    },
    branch_code:{
        type:String,
        required:true,
        unique:true,
    },
    business_code:{
        type:String,
        required:true
    },
    created_At:{
        type:Date,
        required:true
    }
})

const branch = mongoose.model('Branches',branch_Schema);
module.exports = branch;