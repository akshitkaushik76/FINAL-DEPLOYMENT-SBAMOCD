const owner = require('./../MODELS/Owner');
const Counter = require('./../MODELS/counter');
const branch = require('./../MODELS/branch');
const sales = require('../MODELS/sales')
const product = require('../MODELS/product');
const mongoose = require('mongoose')
const customer_business = require('../MODELS/customer_buisness');
const customer = require('../MODELS/customer');
//probability for the race is condition is low, but still exists
async function create_branch_code(business_code) {
    const counter = await Counter.findOneAndUpdate(
        {business_code:business_code},
        {$inc:{seq:1}},
        {new:true,upsert:true}
    )
    const sequence = String(counter.seq);
    return `${business_code}-BR-${sequence}`
}


exports.create_branch = async(req,res,next)=>{
    try{
       const branch_name = req.body.branch_name;
       const owner_data = req.user;
       const business_code = owner_data.business_code;
       const branch_code = await create_branch_code(business_code);
       const data_to_be_saved = {
         branch_name:branch_name,
         branch_code:branch_code,
         business_code:business_code,
         created_At:new Date()
       }
       const branch_data = await branch.create(data_to_be_saved);
       res.status(200).json({
        status:'success',
        branch_data
       })
    }catch(error) {
        console.log("error creating branch->",error);
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}


exports.get_profits_per_branch = async(req,res,next)=>{
    const {branch_code} = req.params;
    try{
        const result = await sales.aggregate([
            {
                $match:{branch_code}
            },
            {
                $group:{
                    _id:"$branch_code",
                    total_profit:{$sum:"$total_profit"},
                    total_sales:{$sum:1}
                }
            },
            {
                $project:{
                    _id:0,
                    branch_code:"$_id",
                    total_profit:1,
                    total_sales:1
                }
            }
        ]);
        res.status(200).json({
            status:"success",
            data:result[0] || {}
        })
    }catch(error) {
        res.status(500).json({
            status:"failure",
            message:error.message
        })
    }
}

exports.get_profits_per_business = async (req, res, next)=>{
    try{
        const {business_code} = req.params;

 const pipeline = [];

pipeline.push({
    $addFields: {
        business_code: {
            $arrayElemAt: [
                { $split: ["$branch_code", "-"] },
                0
            ]
        }
    }
});

if (business_code) {
    pipeline.push({
        $match: { business_code }
    });
}

pipeline.push(
    {
        $group: {
            _id: {
                business_code: "$business_code",
                branch_code: "$branch_code"
            },
            total_profit: { $sum: "$total_profit" },
            total_sales: { $sum: 1 }
        }
    },
    {
        $group: {
            _id: "$_id.business_code",
            branches: {
                $push: {
                    branch_code: "$_id.branch_code",
                    total_profit: "$total_profit",
                    total_sales: "$total_sales"
                }
            },
            business_total_profit: { $sum: "$total_profit" }
        }
    },
    {
        $project: {
            _id: 0,
            business_code: "$_id",
            business_total_profit: 1,
            branches: 1
        }
    }
);

        const result = await sales.aggregate(pipeline);

        res.status(200).json({
            status:'success',
            data:result
        });
    } catch(error) {
        res.status(500).json({
            status:"failure",
            message:error.message
        })
    }
}

// exports.get_investment_per_branch = async (req, res) => {
//     try {
//         const branch_id  = req.params.branchid;

//         console.log("branch_id:", branch_id);

//         if (!branch_id) {
//             return res.status(400).json({
//                 status: "failure",
//                 message: "branch_id is required"
//             });
//         }

//         const matchStage = mongoose.Types.ObjectId.isValid(branch_id)
//             ? { branch_id: new mongoose.Types.ObjectId(branch_id) }
//             : { branch_id: branch_id }; // fallback if stored as string

//         const result = await product.aggregate([
//             { $match: matchStage },
//             {
//                 $group: {
//                     _id: "$branch_id",
//                     total_investment: {
//                         $sum: {
//                             $multiply: ["$cost_price", "$quantity"]
//                         }
//                     }
//                 }
//             }
//         ]);

//         res.status(200).json({
//             status: "success",
//             data: result
//         });

//     } catch (error) {
//         res.status(500).json({
//             status: "failure",
//             message: error.message
//         });
//     }
// };

exports.get_investment_per_branch = async (req, res) => {
  try {
    let branch_id = req.params.branchid?.trim();

    console.log("incoming branch_id:", branch_id);

    if (!branch_id || !mongoose.Types.ObjectId.isValid(branch_id)) {
      return res.status(400).json({
        status: "failure",
        message: "Invalid branch_id"
      });
    }

    const result = await product.aggregate([
      {
        $match: {
          branch_id: new mongoose.Types.ObjectId(branch_id)
        }
      },
      {
        $group: {
          _id: "$branch_id",
          total_investment: {
            $sum: {
              $multiply: ["$cost_price", "$quantity"]
            }
          }
        }
      }
    ]);

    console.log("aggregation result:", result);

    res.status(200).json({
      status: "success",
      total_investment: result[0]?.total_investment || 0
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "failure",
      message: error.message
    });
  }
};

// exports.get_active_customer_business = async(req,res,next)=>{
//     try{
//         const {business_code} = req.params;

//         const count = await customer_business.countDocuments({business_code});
//         const customers = await customer_business.find({business_code});
//         if(!customer) {
//             throw new Error("no data for customers");
//         }
//         if(!count) {
//             throw new Error('invalid business code');
//         }

//         res.status(200).json({
//             status:'success',
//             count:count,
//             customers:customers
//         })
//     } catch(error) {
//         res.status(500).json({
//             status:'failure',
//             message:error.message
//         })
//     }
// }

exports.get_active_customer_business = async (req, res, next) => {
    try {
        const { business_code } = req.params;
        const count     = await customer_business.countDocuments({ business_code });
        const customers = await customer_business.find({ business_code });

        // FIXED: was !customer (undefined variable), now !customers
        if (!customers || customers.length === 0) {
            return res.status(200).json({
                status:    'success',
                count:     0,
                customers: [],
                message:   'No active customers found for this business'
            });
        }
        let customer_data = [];
        for(let key in customers) {
           const customer_code = customers[key].customer_code
           const customer_name = await customer.findOne({customer_code}).select('+customer_name');
           const data = customer[key];
           customer_data.push({
            data,
            customer_name
           })
        }

        res.status(200).json({
            status:    'success',
            count:     count,
            customers: customer_data
        });
    } catch (error) {
        res.status(500).json({
            status:  'failure',
            message: error.message
        });
    }
};

exports.get_branches = async(req,res,next)=>{
    try{
        const business_code = req.params.business_code;
        const branches = await branch.find({business_code});
        if(!branches || branches.length === 0) {
            throw new Error('invalid business code');
        }
        res.status(200).json({
            status:'success',
            branch_data:branches
        })
    }catch(error) {
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}