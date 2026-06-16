const mongoose = require('mongoose');
const product = require('./../MODELS/product');
const Mproduct = require('./../MODELS/measured_product')
const { findOneAndDelete } = require('../MODELS/customer_buisness');

function generate_product_code(product_name,product_per_unit_price) {
    const product_code = `${product_name}${product_per_unit_price}`;
    return product_code;
}
function compute_inclusion_date() {
    const now = new Date();
    const day = now.getDate().toString().padStart('2',0);
    const month = (now.getMonth()+1).toString().padStart('2',0);
    const year = now.getFullYear().toString().padStart('2',0);
    return `${day}/${month}/${year}`;
}

function generate_measured_product_code(product_name,unit,selling_price) {
    let str = ""
    if(unit  == "kilograms") str = "kg"
    else str = "g"
    return `${product_name}str${selling_price}`
}
exports.add_product = async(req,res,next)=>{
    try{
        
        const {branchid} = req.params;

        if(!mongoose.Types.ObjectId.isValid(branchid)) {
            return res.status(400).json({
                status:'failure',
                message:'invalid branch id'
            })
        }
        const branch_id = new mongoose.Types.ObjectId(branchid);
        
        const {product_name,cost_price,selling_price,quantity} = req.body;   
        const product_code = generate_product_code(product_name,selling_price);
        const inclusion_date = compute_inclusion_date();
        const product_information = {
            product_name,
            product_code,
            cost_price,
            selling_price,
            quantity,
            branch_id,
            inclusion_date,
        }
        const product_data = await product.create(product_information);
        res.status(200).json({
            status:'success!,product added successfully',
            product_data
        })
    }catch(error) {
        console.log("error detected->",error);
        res.status(500).json({
            status:'internal server error',
            message:error.message
        })
    }
}


exports.update_product_information = async(req,res,next)=>{
    try{
     
      const {branchid,productcode} = req.params;
      const product_code = productcode;
      if(!mongoose.Types.ObjectId.isValid(branchid)) {
        return res.status(400).json({
            status:'failure',
            message:'invalid branch id'
        })
      }
      const branch_id = new mongoose.Types.ObjectId(branchid);
      let updated_data;
      if(req.body.quantity === undefined) {
         const data_object = {
            ...req.body,
            updation_date:compute_inclusion_date()
         }
          updated_data = await product.findOneAndUpdate(
            {branch_id,product_code},
            data_object,
            {new:true}
          )
      }
      else{
        const fetch_product = await product.findOne({branch_id,product_code});
        const quantity = fetch_product.quantity;
        const data_object = {
            ...req.body,
            quantity:quantity+req.body.quantity,
            updation_date:compute_inclusion_date()
        }
        updated_data = await product.findOneAndUpdate({branch_id,product_code},
            {
                $inc:{quantity:req.body.quantity},
               $set:{updation_date:compute_inclusion_date()}
            },
        
            {new:true});
      }
      
      res.status(200).json({
        status:'success',
        updated_data
      })
    }catch(error) {
        console.log("error detected->",error);
        res.status(500).json({
            status:'internal server error',
            message:error.message
        })
    }
}

exports.get_products = async (req, res) => {
    try {
        const { branchid } = req.params;
        if (!mongoose.Types.ObjectId.isValid(branchid)) {
            return res.status(400).json({ status:'failure', message:'invalid branch id' });
        }
        const branch_id = new mongoose.Types.ObjectId(branchid);
        const products  = await product.find({ branch_id }).sort({ inclusion_date: -1 });
        res.status(200).json({ status:'success', products });
    } catch (error) {
        res.status(500).json({ status:'failure', message: error.message });
    }
};

exports.updatequantity = async(req,res,next)=>{
    try{
      const {branch_id,business_code} = req.params; 
      const {product_code} = req.query
      const {new_quantity} = req.body 
      if(new_quantity == null || new_quantity < 0) return res.status(400).json({ status:'failure', message:'invalid quantity' });
       const branch_id_obj = mongoose.Types.ObjectId.isValid(branch_id)
    ? new mongoose.Types.ObjectId(branch_id)
    : branch_id;
      const updated_product_quantity = await product.findOneAndUpdate(
        {branch_id_obj,business_code,product_code},
        {$set:{quantity:new_quantity,updation_date:compute_inclusion_date()}},
        {new:true,runValidators:true}
        )
       if(!updated_product_quantity) {
          return res.status(404).json({ status:'failure', message:'product not found' });
       }
       res.status(200).json({
        status:'success',
        information:updated_product_quantity
       })
    } catch(error) {
         res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}

exports.delete_product_information = async(req,res,next)=>{
    try{
        const {business_code,branch_id} = req.params;
        const {product_code} = req.query
        const branch_id_obj = mongoose.Types.ObjectId.isValid(branch_id)
       ? new mongoose.Types.ObjectId(branch_id)
       : branch_id;
        const delete_product = await product.findOneAndDelete({business_code,branch_id_obj,product_code});
        if(!delete_product) {
            return res.status(404).json({ status:'failure', message:'product not found' });
        }
        return res.status(200).json({
            status:'success',
            information:delete_product,
            message:'product deleted successfully'
        })
    } catch(error) {
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}


exports.add_measured_product = async(req,res,next)=>{
    try{
       const {business_code,branchid} = req.params;
       const {product_name,unit,quantity,cost_price,selling_price} = req.body;
       const payload = {
        business_code,
        branchid,
        product_name,
        product_code:generate_measured_product_code(product_name,unit,selling_price),
        unit,
        quantity,
        cost_price,
        selling_price,
        date_of_inclusion:compute_inclusion_date()
       }

         if(!mongoose.Types.ObjectId.isValid(branchid)) {
            return res.status(400).json({
                status:'failure',
                message:'invalid branch id'
            })
        }
        const new_product_data = await Mproduct.create(payload);

        res.status(200).json({
            status:'success',
            information:new_product_data
        })

    }catch(error) {
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}