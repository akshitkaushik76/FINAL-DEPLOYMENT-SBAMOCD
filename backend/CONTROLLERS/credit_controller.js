const credit = require('./../MODELS/credit');
const credit_count = require('./../MODELS/credit_count');
const Products_Data =  require('./../MODELS/product');
const mongoose = require('mongoose');
const branch = require('./../MODELS/branch');
const { handleCreditCreate } = require('../ETL/etl_processor');
const { handlePaymentUpdate } = require('../ETL/etl_processor');
const customer = require('../MODELS/customer');
const axios  = require('axios');

async function set_counter(date_customer_code) {
    const counter = await credit_count.findOneAndUpdate(
        {date_customer_code:date_customer_code},
        {$inc:{seq:1}},
        {new:true,upsert:true}
    )
    const seq = String(counter);
    return counter.seq;
}

async function set_credit_code(customer_code) {
    const now = new Date();
    const date = now.getDate().toString().padStart('2',0);
    const month = (now.getMonth()+1).toString().padStart('2',0);
    const year = now.getFullYear().toString().padStart('2',0);
    const date_customer_code = `${customer_code}-${date}${month}${year}`;
    const counter = await set_counter(date_customer_code);
    return `${date_customer_code}-${counter}`;
}

async function get_risk_suggestion(branch_code, phoneNumber, creditAmount) {
    try {
        const { data } = await axios.post(
            `${process.env.ML_SERVICE_URL}/credit/precheck`,
            { branch_code, phoneNumber, creditAmount },
            { timeout: 5000 }
        );
        return {
            decision:        data.decision,
            risk_score:      data.risk_score,
            risk_label:      data.risk_label,
            recommendation:  data.recommendation,
            history_summary: data.history_summary || null,
        };
    } catch (err) {
        // ML service down or error → don't block credit, just skip suggestion
        console.warn('[Precheck] ML service unavailable:', err.message);
        return {
            decision:       'UNAVAILABLE',
            risk_score:     null,
            risk_label:     null,
            recommendation: 'Risk assessment unavailable. Proceed at your discretion.',
            history_summary: null,
        };
    }
}

exports.add_credit = async (req, res, next) => {
    const { customer_code, items, idempotency_key, phoneNumber } = req.body;

    try {
        const { branchid } = req.params;

        // Idempotency check
        if (idempotency_key) {
            const existing = await credit.findOne({ idempotency_key });
            if (existing) {
                return res.status(200).json({
                    status: 'success (retry)',
                    data: existing
                });
            }
        }

        if (!mongoose.Types.ObjectId.isValid(branchid)) {
            throw new Error('invalid branch id');
        }

        const branchData = await branch.findById(branchid).select('branch_code business_code').lean();
        if (!branchData) throw new Error('branch data does not exist');

        const branchObjectId = new mongoose.Types.ObjectId(branchid);

        if (!customer_code || !Array.isArray(items) || items.length === 0) {
            throw new Error('invalid input');
        }

        // Normalize items
        const merged = {};
        for (let item of items) {
            if (!item.product_code || !item.quantity || item.quantity <= 0) {
                throw new Error(`invalid item: ${item.product_code}`);
            }
            merged[item.product_code] = (merged[item.product_code] || 0) + item.quantity;
        }

        const normalizedItems = Object.entries(merged).map(
            ([product_code, quantity]) => ({ product_code, quantity })
        );
        const productCodes = normalizedItems.map(i => i.product_code);

        let retryCount = 0;
        const MAX_RETRY = 3;

        while (retryCount < MAX_RETRY) {
            let stockDeducted = false;

            try {
                const products = await Products_Data.find({
                    product_code: { $in: productCodes },
                    branch_id: branchObjectId
                });

                const productMap = new Map();
                products.forEach(p => productMap.set(p.product_code, p));

                let formatted_items = [];
                let total_amount = 0;

                for (let item of normalizedItems) {
                    const product = productMap.get(item.product_code);
                    if (!product) throw new Error(`product not found: ${item.product_code}`);
                    if (product.quantity < item.quantity) throw new Error(`insufficient stock: ${item.product_code}`);

                    const price_per_unit = product.selling_price;
                    const total_cost = price_per_unit * item.quantity;
                    formatted_items.push({ product_code: item.product_code, quantity: item.quantity, price_per_unit, total_cost });
                    total_amount += total_cost;
                }

                // ── Risk suggestion (non-blocking) ────────────────────────────
                const cust = await customer.findOne({customer_code});

                const risk_suggestion = await get_risk_suggestion(
                    branchData.branch_code,
                    phoneNumber || cust.customer_phonenumber,
                    total_amount
                );
                console.log(`[Precheck] decision=${risk_suggestion.decision} score=${risk_suggestion.risk_score}`);

                // Atomic stock deduction
                const bulkOps = normalizedItems.map(item => ({
                    updateOne: {
                        filter: {
                            product_code: item.product_code,
                            branch_id: branchObjectId,
                            quantity: { $gte: item.quantity }
                        },
                        update: { $inc: { quantity: -item.quantity } }
                    }
                }));

                const bulkResult = await Products_Data.bulkWrite(bulkOps);
                if (bulkResult.modifiedCount !== normalizedItems.length) {
                    throw new Error('race condition');
                }

                stockDeducted = true;

                const credit_code = await set_credit_code(customer_code);

                const new_credit = await credit.create({
                    customer_code,
                    branchid,
                    credit_code,
                    items: formatted_items,
                    total_amount,
                    idempotency_key,
                    risk_suggestion
                });

                handleCreditCreate(
                    new_credit,
                    branchData.branch_code,
                    branchData.business_code
                ).catch(err => console.log("ETL error->", err));

                // ── Always return credit + suggestion, never block ─────────────
                return res.status(201).json({
                    status: 'success',
                    data: new_credit,
                    risk_suggestion
                });

            } catch (err) {
                if (err.message.includes('race condition') && retryCount < MAX_RETRY - 1) {
                    retryCount++;
                    await new Promise(r => setTimeout(r, 50));
                    continue;
                }

                if (stockDeducted) {
                    console.log("rollback triggered");
                    const rollbackOps = normalizedItems.map(item => ({
                        updateOne: {
                            filter: { product_code: item.product_code, branch_id: branchObjectId },
                            update: { $inc: { quantity: item.quantity } }
                        }
                    }));
                    await Products_Data.bulkWrite(rollbackOps);
                }

                throw err;
            }
        }

    } catch (error) {
        console.log("Error:", error.message);

        if (error.code === 11000 && error.keyPattern?.idempotency_key) {
            const existing = await credit.findOne({ idempotency_key });
            return res.status(200).json({ status: 'success (retry)', data: existing });
        }

        res.status(500).json({ status: 'failure', message: error.message });
    }
};

// exports.add_credit = async (req, res, next) => {
//     const { customer_code, items, idempotency_key } = req.body;

//     try {
//         const { branchid } = req.params;

//         //  Idempotency check
//         if (idempotency_key) {
//             const existing = await credit.findOne({ idempotency_key });
//             if (existing) {
//                 return res.status(200).json({
//                     status: 'success (retry)',
//                     data: existing
//                 });
//             }
//         }

//         if (!mongoose.Types.ObjectId.isValid(branchid)) {
//             throw new Error('invalid branch id');
//         }
        
//         const branchData = await branch.findById(branchid).select('branch_code business_code').lean();
    
//         if(!branchData) {
//             throw new Error('branch data does not exist')
//         }

//         const branchObjectId = new mongoose.Types.ObjectId(branchid);
 

//         if (!customer_code || !Array.isArray(items) || items.length === 0) {
//             throw new Error('invalid input');
//         }
         
//         // const phoneNumber = await customer.findOne({customer_code}).select("customer_phonenumber").lean();
//         //  Normalize items
//         const merged = {};
//         for (let item of items) {
//             if (!item.product_code || !item.quantity || item.quantity <= 0) {
//                 throw new Error(`invalid item: ${item.product_code}`);
//             }
//             merged[item.product_code] =
//                 (merged[item.product_code] || 0) + item.quantity;
//         }

//         const normalizedItems = Object.entries(merged).map(
//             ([product_code, quantity]) => ({ product_code, quantity })
//         );

//         const productCodes = normalizedItems.map(i => i.product_code);

//         let retryCount = 0;
//         const MAX_RETRY = 3;

//         while (retryCount < MAX_RETRY) {

//             let stockDeducted = false; // 🔥 CRITICAL FLAG

//             try {
//                 const products = await Products_Data.find({
//                     product_code: { $in: productCodes },
//                     branch_id: branchObjectId
//                 });

//                 const productMap = new Map();
//                 products.forEach(p => productMap.set(p.product_code, p));

//                 let formatted_items = [];
//                 let total_amount = 0;

//                 for (let item of normalizedItems) {
//                     const product = productMap.get(item.product_code);

//                     if (!product) {
//                         throw new Error(`product not found: ${item.product_code}`);
//                     }

//                     if (product.quantity < item.quantity) {
//                         throw new Error(`insufficient stock: ${item.product_code}`);
//                     }

//                     const price_per_unit = product.selling_price;
//                     const total_cost = price_per_unit * item.quantity;

//                     formatted_items.push({
//                         product_code: item.product_code,
//                         quantity: item.quantity,
//                         price_per_unit,
//                         total_cost
//                     });

//                     total_amount += total_cost;
//                 }

//                 //  Atomic stock deduction
//                 const bulkOps = normalizedItems.map(item => ({
//                     updateOne: {
//                         filter: {
//                             product_code: item.product_code,
//                             branch_id: branchObjectId,
//                             quantity: { $gte: item.quantity }
//                         },
//                         update: {
//                             $inc: { quantity: -item.quantity }
//                         }
//                     }
//                 }));

//                 const bulkResult = await Products_Data.bulkWrite(bulkOps);

//                 if (bulkResult.modifiedCount !== normalizedItems.length) {
//                     throw new Error('race condition');
//                 }

//                 stockDeducted = true; //  mark success

//                 const credit_code = await set_credit_code(customer_code);

//                 const new_credit = await credit.create({
//                     customer_code,
//                     branchid,
//                     credit_code,
//                     items: formatted_items,
//                     total_amount,
//                     idempotency_key
//                 });

//                 handleCreditCreate(
//                     new_credit,
//                     branchData.branch_code,
//                     branchData.business_code // you can pass branch_code later if needed
//                      // replace properly
//                 ).catch(err=> console.log("ETL error->",err));
//                 return res.status(201).json({
//                     status: 'success',
//                     data: new_credit
//                 });

//             } catch (err) {

//                 //  Retry only race condition
//                 if (err.message.includes('race condition') && retryCount < MAX_RETRY - 1) {
//                     retryCount++;

//                     //  small delay (VERY IMPORTANT)
//                     await new Promise(r => setTimeout(r, 50));

//                     continue;
//                 }

//                 //  SAFE rollback
//                 if (stockDeducted) {
//                     console.log(" rollback triggered");

//                     const rollbackOps = normalizedItems.map(item => ({
//                         updateOne: {
//                             filter: {
//                                 product_code: item.product_code,
//                                 branch_id: branchObjectId
//                             },
//                             update: {
//                                 $inc: { quantity: item.quantity }
//                             }
//                         }
//                     }));

//                     await Products_Data.bulkWrite(rollbackOps);
//                 }

//                 throw err;
//             }
//         }

//     } catch (error) {
//         console.log("Error:", error.message);

//         if (error.code === 11000 && error.keyPattern?.idempotency_key) {
//             const existing = await credit.findOne({ idempotency_key });
//             return res.status(200).json({
//                 status: 'success (retry)',
//                 data: existing
//             });
//         }

//         res.status(500).json({
//             status: 'failure',
//             message: error.message
//         });
//     }
// };

//  using cancel and create new approach for updating the credit


const normalized_Items = (items)=>{
    const merged = {};
    for(let item of items) {
        if(!item.product_code || !item.quantity || item.quantity <= 0) {
            throw new Error(`invalid item : ${item.product_code}`);
        }
        merged[item.product_code] = (merged[item.product_code] || 0)+ item.quantity;
    }
    return Object.entries(merged).map(
        ([product_code,quantity]) => ({product_code,quantity})
    );
};

const cancel_credit_logic = async(credit_code)=>{
    const existingCredit = await credit.findOneAndUpdate(
        {credit_code,
            credit_state:"ACTIVE"
        },
        {
            $set:{credit_state:"CANCELLED"}
        },
        {new :true}
    );

    if(!existingCredit) {
        throw new Error("credit not found or already cancelled");
    }

    const branchObjectId = new mongoose.Types.ObjectId(existingCredit.branchid);

    const rollbackOps = existingCredit.items.map(item=>({
         updateOne:{
            filter:{
                product_code:item.product_code,
                branch_id:branchObjectId
            },
            update:{
                $inc:{quantity:item.quantity}
            }
         }
    }));

    await Products_Data.bulkWrite(rollbackOps);
    return existingCredit;
}


//credit updation with recovery flag//

exports.update_credit = async(req,res,next)=>{
    const {credit_code} = req.params;
    const {customer_code,items,idempotency_key} = req.body;

    try{
        if(!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("invalid items");
        }

        //marking it to be update started//
        await credit.updateOne(
            {credit_code},
            {$set:{update_in_progress:true}}
        );


        const cancelledCredit = await cancel_credit_logic(credit_code);
        const branchObjectId = new mongoose.Types.ObjectId(cancelledCredit.branchid);

        const normalizedItems = normalized_Items(items);
        const productCodes = normalizedItems.map(i => i.product_code);
        
        const branchData = await branch.findById(cancelledCredit.branchid)
    .select('branch_code business_code').lean();

//        const cancelledCredit = await cancel_credit_logic(credit_code);
// const branchObjectId  = new mongoose.Types.ObjectId(cancelledCredit.branchid);
// const normalizedItems = normalized_Items(items);
// const productCodes    = normalizedItems.map(i => i.product_code);

// ── Precheck for update ───────────────────────────────────
const cust_for_check = await customer.findOne({
    customer_code: customer_code || cancelledCredit.customer_code
}).lean();

// Calculate new total for risk scoring
const products_for_check = await Products_Data.find({
    product_code: { $in: productCodes },
    branch_id:    branchObjectId
}).lean();

  const estimated_total = products_for_check.reduce((sum, p) => {
    const item = normalizedItems.find(i => i.product_code === p.product_code);
    return sum + (p.selling_price * (item?.quantity || 0));
  }, 0);

  const update_risk = await get_risk_suggestion(
    branchData?.branch_code || cancelledCredit.branchid.toString(),
    cust_for_check?.customer_phonenumber || null,
    estimated_total
  );
  console.log(`[Update Precheck] decision=${update_risk.decision} score=${update_risk.risk_score}`);
// ─────────────────────────────────────────────────────────

        let retryCount = 0;
        let MAX_RETRY =   3;

        while(retryCount < MAX_RETRY) {
            let stockDeducted = false;
            try{
                const products = await Products_Data.find({
                    product_code:{$in:productCodes},
                    branch_id:branchObjectId
                }).lean();

                const productMap = new Map();
                products.forEach(p=>productMap.set(p.product_code,p));

                let formatted_items = [];
                let total_amount = 0;
                for(let item of normalizedItems) {
                    const product = productMap.get(item.product_code);

                    if(!product) {
                        throw new Error('product not found');
                     }

                     if(product.quantity < item.quantity) {
                        throw new Error(`insufficient stock : ${item.product_code}`)
                     }

                     const total_cost = product.selling_price * item.quantity;

                     formatted_items.push({
                        product_code:item.product_code,
                        quantity:item.quantity,
                        price_per_unit:product.selling_price,
                        total_cost
                     });

                     total_amount += total_cost;
                }

                const bulkOps = normalizedItems.map(item=>({
                    updateOne:{
                        filter:{
                            product_code:item.product_code,
                            branch_id:branchObjectId,
                            quantity :{$gte:item.quantity}
                        },
                        update:{
                            $inc:{quantity : -item.quantity}
                        }
                    }
                }));

                const result = await Products_Data.bulkWrite(bulkOps);

                if(result.modifiedCount !== normalizedItems.length) {
                    throw new Error("race condition")
                }

                stockDeducted = true;

                //creating a new credit//
                const new_credit_code = credit_code;

                const newCredit = await credit.create({
                    customer_code:customer_code || cancelledCredit.customer_code,
                    branchid:cancelledCredit.branchid,
                    credit_code:new_credit_code,
                    items:formatted_items,
                    total_amount,
                    idempotency_key,
                    credit_state:"ACTIVE",
                    update_in_progress:false,
                    risk_suggestion:update_risk
                });


                await credit.updateOne(
                    {credit_code},
                    {$set:{update_in_progress:false}},

                );
                console.log("risk suggestion is->",update_risk)
                return res.status(200).json({
                    status:'success',
                    message:'credit updated',
                    old_credit:cancelledCredit.credit_code,
                    new_credit:newCredit,
                    risk_suggestion: update_risk
                })
            } catch(err) {
                if(err.message.includes("race condition") && retryCount < MAX_RETRY) {
                    retryCount++;
                    await new Promise(r => setTimeout(r,50));
                    continue;
                }

                //rollback if deducted//

                if(stockDeducted) {
                    const rollbackOps = normalizedItems.map(item=>({
                        updateOne:{
                            filter:{
                                product_code:item.product_code,
                                branch_id:branchObjectId
                            },
                            update: {
                                $inc: {quantity :item.quantity}
                            }
                        }
                    }));

                    await Products_Data.bulkWrite(rollbackOps);
                }

                await credit.updateOne(
                    {credit_code},
                    {$set:{update_in_progress:false}}
                );
                throw err;
            }
        }
    } catch(error) {
        // ensuring flag reset even on outer failure
        await credit.updateOne(
            {credit_code},
            {$set:{update_in_progress:false}}
        );

        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}


exports.bulk_settle_credit = async(req,res,next)=>{
    const {customer_code,customer_phonenumber,amount} = req.body;

    try{
        if(!amount || amount <= 0) {
            throw new Error('invalid amount');
        }
        if(!customer_code && !customer_phonenumber) {
            throw new Error('customer identifier required');
        }

        let remainingPayment = amount;

        const credits = await credit.find({
            ...(customer_code && {customer_code}),
            ...(customer_phonenumber && {customer_phonenumber}),
            credit_state:'ACTIVE',
            remaining_amount: {$gt:0}
        })
        .select("_id remaining_amount total_amount amount_paid")
        .sort({createdAt:1})
        .lean();

        if(!credits.length) {
            throw new Error("no pending credits");
        }

        //computing distribution in memory

        let updates = [];

        for(let c of credits) {
            if(remainingPayment <= 0)  break;

            const payable = Math.min(c.remaining_amount, remainingPayment);

            updates.push({
                id:c._id,
                payable,
                new_remaining:c.remaining_amount - payable
            })

            remainingPayment -= payable;
        }

        const bulkOps = updates.map(u=>({
            updateOne:{
                filter:{
                    _id: u.id,
                    remaining_amount : {$gte: u.payable}
                },
                update:{
                    $inc:{
                        amount_paid:u.payable,
                        remaining_amount: -u.payable
                    },
                    $set:{
                        status: u.new_remaining === 0 ? "settled" : "partially-settled"
                    }
                }
            }
        }));

        const result = await credit.bulkWrite(bulkOps);

        return res.status(200).json({
            status:"success",
            total_paid: amount - remainingPayment,
            remaining_unallocated: remainingPayment,
            updated_count: result.modifiedCount
        });
    }catch(error) {
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}


exports.settle_credit_with_code = async (req, res) => {
    const { credit_code } = req.params;
    const { amount } = req.body;

    try {
        if (!amount || amount <= 0) {
            throw new Error("please specify a correct amount");
        }

        const credit_info = await credit.findOne({
            credit_code,
            credit_state: 'ACTIVE'
        });

        if (!credit_info) {
            return res.status(404).json({
                status: 'failure',
                message: `credit not found for code ${credit_code}`
            });
        }

        if (amount > credit_info.remaining_amount) {
            return res.status(400).json({
                status: 'failure',
                message: 'amount exceeds remaining credit'
            });
        }

        const new_remaining = credit_info.remaining_amount - amount;

        const updated_credit = await credit.findOneAndUpdate(
            {
                credit_code,
                credit_state: 'ACTIVE',
                remaining_amount: { $gte: amount } // 🔥 race-safe
            },
            {
                $inc: {
                    amount_paid: amount,
                    remaining_amount: -amount
                },
                $set: {
                    status: new_remaining === 0 ? 'settled' : 'partial-settled'
                }
            },
            { new: true }
        );

        if (!updated_credit) {
            throw new Error("concurrent update detected, try again");
        }
        
        handlePaymentUpdate(
            updated_credit,
            amount
        ).catch(err => console.error("ETL Payment Error:", err));

        res.status(200).json({
            status: 'success',
            data: updated_credit
        });

    } catch (error) {
        res.status(500).json({
            status: 'failure',
            error: error.message
        });
    }
};

// exports.add_credit = async(req,res,next)=>{
//     const session = await mongoose.startSession();
//       const {customer_code,items,idempotency_key} = req.body;
//     try{
//         const result = await session.withTransaction(async ()=>{
//             const {branchid} = req.params;
          
            
//              console.log("branch id from request->",branchid);
//             if(idempotency_key) {
//                 const existing = await credit.findOne({idempotency_key}).session(session);
//                 if(existing) {
//                    return existing;
//                 }
//             }

//             if(!mongoose.Types.ObjectId.isValid(branchid)) {
//                 throw new Error('invalid branch id');
//             }
//               const branchObjectId = new mongoose.Types.ObjectId(branchid);
//             if(!customer_code || !Array.isArray(items) || items.length === 0) {
//                 throw new Error('invalid input');
//             }

//             const merged = {};
//             for(let item of items) {
//                 if(!item.product_code || !item.quantity || item.quantity <= 0) {
//                     throw new Error(`invalid item: ${item.product_code}`);
//                 }
//                 merged[item.product_code] = (merged[item.product_code] || 0)+item.quantity;
//             }
//             const normalizedItems = Object.entries(merged).map(
//                 ([product_code,quantity])=> ({product_code,quantity})
//             );
//             console.log(normalizedItems);
//             const productCodes = normalizedItems.map(i => i.product_code);
//             console.log(productCodes);
//             const products = await Products_Data.find({
//                 product_code:{$in:productCodes},
//                 branch_id:branchObjectId
//             }).session(session);
            
//             // --- TEMP DEBUG ---
// const allProducts = await Products_Data.find({
//     product_code: { $in: productCodes }
// })

// console.log("All matching products (any branch):", allProducts.length);
// allProducts.forEach(p => {
//     console.log({
//         product_code: p.product_code,
//         stored_branch_id: p.branch_id?.toString(),
//         query_branch_id: branchObjectId.toString(),
//         match: p.branch_id?.toString() === branchObjectId.toString()
//     });
// });
// // --- END DEBUG ---

//             console.log("Query filter →", { productCodes, branchObjectId: branchObjectId.toString() });
//             console.log("Products found →", products.length);

//             console.log("this should be the product arr->",products);

//             const productMap = new Map();
//             products.forEach(p => productMap.set(p.product_code,p));
            
//             console.log("this is the product map->",productMap);

//             let formatted_items = [];
//             let total_amount = 0;

//             for(let item of normalizedItems) {
//                 const product = productMap.get(item.product_code);
                
//                 console.log("this is the product->",product);

//                 if(!product) {
//                     throw new Error(`product not found ${item.product_code}`);
//                 }

//                 if(product.quantity < item.quantity) {
//                     throw new Error(`insufficient stock for ${item.product_code}`);
//                 }

//                 const price_per_unit = product.selling_price;
//                 const total_cost = price_per_unit * item.quantity;
                
//                 formatted_items.push({
//                     product_code:item.product_code,
//                     quantity:item.quantity,
//                     price_per_unit,
//                     total_cost:total_cost
//                 });

//                 total_amount += total_cost;

//             }
//               const bulkOps = normalizedItems.map(item=>({
//                 updateOne:{
//                     filter:{
//                         product_code:item.product_code,
//                         branch_id:branchObjectId,
//                         quantity:{$gte :item.quantity}
//                     },
//                     update:{
//                         $inc:{quantity: -item.quantity}
//                     }
//                 }
//               }));

//               const bulkResult = await Products_Data.bulkWrite(bulkOps,{session});

//               if(bulkResult.modifiedCount !== normalizedItems.length) {
//                 throw new Error('stock update mismatch (race condition)');
//               }
//               const credit_code = await set_credit_code(customer_code,session);
//               const new_credit = await credit.create([{
//                 customer_code,
//                 branchid,
//                 credit_code,
//                 items:formatted_items,
//                 total_amount,
//                 idempotency_key
//               }],{session});

//               return new_credit[0];
//         });
//         res.status(201).json({
//             status:'success',
//             data:result
//         })
//     }catch(error) {
//         console.log("Error:", error.message);
//         if(error.code === 11000 && error.keyPattern?.idempotency_key) {
//             const existing  = await credit.findOne({idempotency_key});
//             return res.status(200).json({
//                 status:'success (retry)',
//                 data:existing,
//             });
//         }
//         res.status(500).json({
//             status:'failure',
//             message:error.message
//         })
//     } finally{
//         session.endSession();
//     }
// }

exports.get_credit = async(req,res,next)=>{
    try{
        const {credit_code,branchid} = req.params;
        console.log(branchid);
        if(!mongoose.Types.ObjectId.isValid(branchid)) {
            throw new Error('invalid branch id');
        }

        const branchObjectId = new mongoose.Types.ObjectId(branchid);

        
        const credit_info = await credit.findOne({credit_code,branchid:branchObjectId});
        if(!credit_info) {
            throw new Error('the credit records for the credentials doesnot exist');
        }
        res.status(200).json({
            status:'success',
            data:credit_info
        })
    }catch(error) {
        console.log("error->",error.message);
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}
exports.get_credit_by_status = async(req,res,next)=>{
    try{
        const {branchid} = req.params;
        if(!mongoose.Types.ObjectId.isValid(branchid)) {
            throw new Error('invalid branch id');
        }
        const branchObjectId = new mongoose.Types.ObjectId(branchid);
        const unsettled_credits = await credit.find({branchid:branchObjectId,status:'unsettled',credit_state:'ACTIVE'});
        const settled_credits = await credit.find({branchid:branchObjectId,status:'settled',credit_state:'ACTIVE'});
        const partial_settled_credit = await credit.find({branchid:branchObjectId,status:'partial-settled',credit_state:'ACTIVE'});
        const count_unsettled = await credit.countDocuments({branchid:branchObjectId,status:'unsettled',credit_state:'ACTIVE'});
        const count_settled = await credit.countDocuments({branchid:branchObjectId,status:'settled',credit_state:'ACTIVE'});
        const count_partial = await credit.countDocuments({branchid:branchObjectId,status:'partial-settled',credit_state:'ACTIVE'});
        res.status(200).json({
            status:'success',
            settled_count:count_settled,
            unsettled_count:count_unsettled,
            partial_count:count_partial,
            settled:settled_credits,
            unsettled:unsettled_credits,
            partial:partial_settled_credit
        })

    }catch(error) {
        console.log("error->",error.message);
        res.status(500).json({
            status:'failure',
            error:error.message
        })
    }
}

exports.search_customers = async (req, res) => {
    try {
        const { q, business_code } = req.query;

        if (!q || q.trim().length < 1) {
            return res.status(200).json({ status:'success', customers:[] });
        }

        const Customer         = require('../MODELS/customer');
        const CustomerBusiness = require('../MODELS/customer_buisness');

        // Step 1 — get enrolled customer_codes for this business
        let enrolledCodes = null;
        if (business_code) {
            const enrolled = await CustomerBusiness.find({ business_code })
                .select('customer_code').lean();
            enrolledCodes = enrolled.map(e => e.customer_code);

            if (enrolledCodes.length === 0) {
                return res.status(200).json({ status:'success', customers:[] });
            }
        }

        // Step 2 — build query without regex on phone
        // phone is a Number field — try exact match if q looks like a number
        const isNumber = /^\d+$/.test(q.trim());

        const orConditions = [
            { customer_name: { $regex: q, $options:'i' } },
            { customer_code: { $regex: q, $options:'i' } },
        ];

        // Only add phone match if query is numeric
        if (isNumber) {
            orConditions.push({ customer_phonenumber: Number(q) });
        }

        const searchQuery = {
            $or: orConditions,
            // Restrict to enrolled customers if business_code given
            ...(enrolledCodes !== null && {
                customer_code: { $in: enrolledCodes }
            })
        };

        const customers = await Customer.find(searchQuery)
            .select('customer_name customer_code customer_phonenumber customer_email')
            .limit(8)
            .lean();

        console.log(`[search_customers] q="${q}" found=${customers.length}`);
        res.status(200).json({ status:'success', customers });

    } catch (error) {
        console.error('[search_customers] error:', error.message);
        res.status(500).json({ status:'failure', message: error.message });
    }
};

exports.get_credits_by_customer = async (req, res) => {
    try {
        const { customer_code, branchid } = req.params;

        const query = { customer_code, credit_state:'ACTIVE' };

        // If branchid provided, filter by branch
        if (branchid && mongoose.Types.ObjectId.isValid(branchid)) {
            query.branchid = new mongoose.Types.ObjectId(branchid);
        }

        const [unsettled, partial, settled] = await Promise.all([
            credit.find({ ...query, status:'unsettled' }).select('credit_code customer_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate').sort({ createdAt:-1 }).lean(),
                  
            credit.find({ ...query, status:'partial-settled' }).select('credit_code customer_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate')
                  .sort({ createdAt:-1 }).lean(),
            credit.find({ ...query, status:'settled' }).select('credit_code customer_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate')
                  .sort({ createdAt:-1 }).lean(),
        ]);

        const total_outstanding = unsettled.reduce((s, c) =>
            s + (c.remaining_amount || 0), 0)
            + partial.reduce((s, c) => s + (c.remaining_amount || 0), 0);

        const total_credited = [...unsettled, ...partial, ...settled]
            .reduce((s, c) => s + (c.total_amount || 0), 0);

        res.status(200).json({
            status:           'success',
            customer_code,
            total_credited,
            total_outstanding,
            unsettled_count:  unsettled.length,
            partial_count:    partial.length,
            settled_count:    settled.length,
            unsettled,
            partial,
            settled,
        });
    } catch (error) {
        res.status(500).json({ status:'failure', message: error.message });
    }
};