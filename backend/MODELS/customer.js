const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const customer_schema = mongoose.Schema({
    customer_name:{
        type:String,
        required:true,
    },
    customer_email:{
        type:String,
        required:true,
        validate:[validator.isEmail,'please enter a valid email'],
        unique:[true,'the email is already registered']
    },
    customer_code:{
        type:String,
        required:true
    },
    customer_phonenumber:{
        type:Number,
        required:[true,'please enter mobile number'],
        unique:[true,'the number is already registered']
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    confirm_password:{
        type:String,
        required:[true,'please confirm the password to continue'],
        validate:{ validator:function(value) {
            return value === this.password
        },
        message:'the password and confirm password does not match'
    }
},
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetTokenExpires:Date
})

customer_schema.pre('save',async function(){
    if(!this.isModified('password')) {
        return ;
    }
    this.password = await bcrypt.hash(this.password,13);
    this.confirm_password = undefined
    
})
customer_schema.methods.comparePasswordinDb = async function(pswd,pswdDB) {
    return await bcrypt.compare(pswd,pswdDB);
}

customer_schema.methods.isPasswordChanged = async function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        console.log("this password changed at",JWTTimestamp);
        const pswdChangedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp < pswdChangedTimestamp
    }
    return false;
}

module.exports = mongoose.model('Customer_data',customer_schema)