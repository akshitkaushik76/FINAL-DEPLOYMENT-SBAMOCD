const mongoose = require('mongoose');

const sales_count_schema = new mongoose.Schema({
    sales_date_string:{
        type:String,
        required:true,
        unique:true
    },
    seq:{
        type:Number,
        default:0
    }
})


module.exports = mongoose.model('sales_count',sales_count_schema);