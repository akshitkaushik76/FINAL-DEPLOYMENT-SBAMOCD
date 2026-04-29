const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Deflate } = require('zlib');
const owner_schema = mongoose.Schema({
    owner_name:{
        type:String,
        required:true
    },
    emailid:{
        type:String,
        required:[true,'please enter a valid email address'],
        validate:[validator.isEmail,'please enter a valid email address'],
        unique:[true,'this email is already registered']
    },
    phone_number:{
        type:Number,
        required:true,
        unique:[true,'this phone number is already registered']
    },
    business_code:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength:8,
    },
    confirm_password:{
        type:String,
        required:true,
        validate:{validator:function(value) {
            return value === this.password;
        },
        message:'the password and confirm password does not match'
    }
},
    passwordChangedAt:Date,
    passwordResetToken:String,
    passwordResetTokenExpires:Date,
})

owner_schema.pre('save',async function(){
    if(!this.isModified('password')) {
        return ;
    }
    this.password = await bcrypt.hash(this.password,13);
    this.confirm_password = undefined;
})

owner_schema.methods.comparePasswordinDb = async function(pswd,pswdDB) {
    return await bcrypt.compare(pswd,pswdDB);
}
owner_schema.methods.isPasswordChanged = async function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        console.log("this password changed at",JWTTimestamp);
        const pswdChangedTimestamp = parseInt(this.passwordChangedAt.getTime()/1000,10);
        return JWTTimestamp < pswdChangedTimestamp
    }
    return false;
}

module.exports = mongoose.model('Owner_data',owner_schema);