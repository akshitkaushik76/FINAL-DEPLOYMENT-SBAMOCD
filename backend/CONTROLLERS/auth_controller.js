const jwt = require('jsonwebtoken');

const customers = require('./../MODELS/customer');

const owners = require('./../MODELS/Owner');
const util = require('util');

const signup_token = (data) => {
    const token = jwt.sign({id:data._id},process.env.secret_string,{
        expiresIn:process.env.expiresIn
    })
    return token
}

async function get_occurances(reduced_name_to_third_literal) {
    const count = await customers.countDocuments({
        customer_code:{$regex:`${reduced_name_to_third_literal}`}
    })
    return count+1
}

async function generating_customer_code(customer_name) {
  const reduced_name_to_third_literal = customer_name.slice(0,3).toLowerCase()
  const numerical_literal = await get_occurances(reduced_name_to_third_literal);
  const customer_code = `CUST-${reduced_name_to_third_literal}${numerical_literal}`
  return customer_code
}


async function get_occurances_owner(reduced_owner_name) {
    const count = await owners.countDocuments({
        business_code:{$regex:`${reduced_owner_name}`}
    })
    return count+1;
} 

async function generate_owner_business_code(owner_name) {
    const reduced_owner_name = owner_name.slice(0,3).toUpperCase();
    const numerical_literal = await get_occurances_owner(reduced_owner_name);
    const business_code = `${reduced_owner_name}${numerical_literal}`;
    return business_code
}





exports.register_customers = async(req,res,next)=>{
    try{
        const data_to_be_saved = {
            ...req.body,
            customer_code:await generating_customer_code(req.body.customer_name)
        }
        const data = await customers.create(data_to_be_saved);
        const token = signup_token(data);
        res.status(200).json({
            status:'success',
            token:token,
            data
        })
    }catch(error) {
        console.log("error while saving->",error);
        res.status(500).json({
            status:'internal server error',
            message:error.message
        })
    }
}

exports.register_owner = async(req,res,next)=>{
    try{
        const data = {
            ...req.body,
            business_code: await generate_owner_business_code(req.body.owner_name)
        }
        const owner_data = await owners.create(data);
        const token = signup_token(data);
        res.status(200).json({
            status:'success',
            token:token,
            data:owner_data
        })
    }catch(error) {
        console.log("error while saving owner's data->",error.message);
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}


exports.login_customer = async(req,res,next)=>{
    try{
        const {customer_email,password} = req.body;
        if(!customer_email || !password) {
            return res.status(400).json({
                status:'failure',
                message:'please enter all fields to continue'
            })
        }

        const user = await customers.findOne({customer_email}).select('+password');
        console.log(user);
        if(!user) {
            return res.status(400).json({
                status:'failure',
                message:'entered credentials are wrong '
        })
        }
        const isMatch = await user.comparePasswordinDb(password,user.password);
        if(!isMatch) {
            return res.status(400).json({
                status:'failure',
                message:'please enter a correct password'
            })
        }

        const token = signup_token(user);
        res.status(201).json({
            status:'success',
            message:'logged in successfully!',
            token:token
        })
    } catch(error) {
        console.error('error while logging in->',error.message);
        res.status(500).json({
            status:'internal server error',
            message:error.message
        })
    }
}

exports.login_owner = async(req,res,next)=>{
    try{
        const {emailid,password} = req.body;

        if(!emailid || !password) {
            return res.status(400).json({
                status:'failure',
                message:'please provide all credentials',
            })
        }

        const user = await owners.findOne({emailid}).select('+password');
        if(!user) {
            return res.status(400).json({
                status:'failure',
                message:'please enter the correct email to continue'
            })
        }
        const isMatch = await user.comparePasswordinDb(password,user.password);
        if(!isMatch) {
            return res.status(400).json({
                status:'failure',
                message:'please enter the correct password to continue'
            })
        }
        const token = signup_token(user);
        res.status(200).json({
            status:'success',
            message:'logged in successfully',
            token:token
        })
    } catch(error) {
        console.error("error occurred while logging in->",error);
        res.status(500).json({
            status:'internal server error',
            message:error.message
        })
    }
}


const protect = (model)=>async(req,res,next)=>{
    const test_token = req.headers.authorization;
    let token;
    if(test_token && test_token.startsWith('Bearer')) {
        token = test_token.split(' ')[1];
    }
    console.log(token);
    if(!token) {
        return res.status(400).json({
            status:'fail',
            message:'login to access the features'
        })
    }
    const decoded_token = await util.promisify(jwt.verify)(token,process.env.secret_string);
    console.log(decoded_token);

    const user = await model.findById(decoded_token.id);
    console.log(user);

    if(!user) {
        return res.status(400).json({
           status:'fail',
           message:'unauthorized access, the user with the token does not exist'
        })
    }

    if(await user.isPasswordChanged(decoded_token.iat)) {
        return res.status(400).json({
            status:'failure',
            message:'password changed recently,please login again!'
        })
    }
    req.user = user;
    next();
}

exports.protect_owner = protect(owners);
exports.protect_customer = protect(customers)
