const sales_schema = require('./../MODELS/sales');
const sales_count = require('./../MODELS/sales_counter');
const product_data = require('./../MODELS/product'); 
const mongoose = require('mongoose');
const { handleSale } = require('../ETL/etl_processor');
const Branch = require('../MODELS/branch');

function issuedate() {
   const now = new Date();
    const year = now.getFullYear().toString().padStart(2,'0');

    const month = (now.getMonth()+1).toString().padStart(2,'0');

    const date = now.getDate().toString().padStart(2,'0'); 

    return `${date}/${month}/${year}`;
}

async function create_count(sales_date_string) {
    const counter = await sales_count.findOneAndUpdate(
        {sales_date_string},
        {$inc:{seq:1}},
        {new:true,upsert:true}
    )
    return counter.seq;
 }

 async function create_sales_code(branch_code) {
   const now = new Date();
    const year = now.getFullYear().toString().padStart(2,'0');

    const month = (now.getMonth()+1).toString().padStart(2,'0');

    const date = now.getDate().toString().padStart(2,'0');
    
    const sales_date_String = `${branch_code}-${date}-${month}-${year}`;

    const count = await create_count(sales_date_String);
    return `${sales_date_String}-${count}`;
 }


 exports.add_sales = async(req,res,next)=>{
   const {items,idempotency_key} = req.body;
   const {branch_id,branch_code} = req.params;

   try{
    
     if(!mongoose.Types.ObjectId.isValid(branch_id)) {
        throw new Error('invalid branch id');
     }
     
     const branchObjectId = new mongoose.Types.ObjectId(branch_id);

     if(idempotency_key) {
        const existing = await sales_schema.findOne({idempotency_key});
        if(existing) {
            return res.status(200).json({
                status:'success (retry)',
                data:existing
            })
        }
     }
     if(!branch_code  || !Array.isArray(items) || items.length === 0) {
        throw new Error('invalid input');
     }

     const merged = {};
     for(let item of items) {
        if(!item.product_code || !item.quantity || item.quantity < 0) {
            throw new Error(`invalid item : ${item.product_code}`);
        }
        merged[item.product_code] = (merged[item.product_code] || 0) + item.quantity;

     }

     const normalized_Items = Object.entries(merged).map(
        ([product_code,quantity]) => ({product_code,quantity})
     );

     const productCodes = normalized_Items.map(i => i.product_code);

     let retryCount = 0;
     const MAX_RETRY = 3;

     while( retryCount < MAX_RETRY) {
        let stockDeducted = false;

        try{
            const products = await product_data.find({
                product_code:{$in:productCodes},
                branch_id:branchObjectId,
            });
 
            const beforeStockMap = new Map();
                products.forEach(p => {
                beforeStockMap.set(p.product_code, p.quantity);
            });

            const productMap = new Map();
            products.forEach(p => productMap.set(p.product_code,p));

            let formatted_items = [];
            let total_sale_cost = 0;
            let total_profit = 0;
            for(let item of normalized_Items) {
                const product = productMap.get(item.product_code);

                if(!product) {
                    throw new Error(`product not found ${item.product_code}`);
                }

                if(product.quantity < item.quantity) {
                    throw new Error(`insufficient stock :${item.product_code}`);
                }

                const total_cost = product.selling_price*item.quantity;

                formatted_items.push({
                    product_code:item.product_code,
                    quantity:item.quantity,
                    total_cost
                });
                total_sale_cost += total_cost;
                total_profit += (total_cost - product.cost_price*item.quantity);
            } 

            const bulkOps  = normalized_Items.map(item=>({
                updateOne:{
                    filter:{
                        product_code:item.product_code,
                        branch_id:branchObjectId,
                        quantity: {$gte:item.quantity}
                    },
                    update:{
                        $inc:{quantity: -item.quantity}
                    }
                }
            }));

            const result = await product_data.bulkWrite(bulkOps);
            if(result.modifiedCount !== normalized_Items.length) {
                throw new Error("race condition");
            }
            stockDeducted = true;

            const sales_code = await create_sales_code(branch_code);
            const issue_date = issuedate();

            const sales_data = await sales_schema.create({
                branch_code,
                items:formatted_items,
                issueDate: issue_date,
                total_sale_cost,
                total_profit,
                sales_code,
                idempotency_key
            });

           // ───── FETCH BUSINESS CODE ─────
            const branchData = await Branch
               .findOne({ branch_code })
               .select('business_code')
               .lean();

            if (!branchData) {
               throw new Error("branch not found");
            }

// ───── ETL HOOK (NON-BLOCKING) ─────
           handleSale(
               sales_data,
               beforeStockMap,
               branch_code,
              branchData.business_code
            ).catch(err => console.error("ETL Sales Error:", err));

// ───── RESPONSE ─────
return res.status(200).json({
    status:'success',
    data:sales_data
});
        } catch(err) {
            if(err.message.includes('race condition') && retryCount < MAX_RETRY-1) {
                retryCount++;

                await new Promise(r => setTimeout(r,50));
                continue
            }
            
            if(stockDeducted) {
                console.log("rollback triggered");
                const rollbackOps = normalized_Items.map(item=>({
                    updateOne:{
                        filter:{
                            product_code:item.product_code,
                            branch_id:branchObjectId
                        },
                        update:{
                            $inc: {quantity: item.quantity}
                        }
                    }
                }));

                await product_data.bulkWrite(rollbackOps);
            }

            throw err;
        }
     }
   } catch(error) {
    console.log("error",error.message);
    if(error.code === 11000 && error.keyPattern?.idempotency_key) {
        const existing = await sales_schema.findOne({idempotency_key}) ;
            return res.status(200).json({
                status:'succes (retry)',
                data: existing
            })
        
    }

    res.status(500).json({
        status:'failure',
        message:error.message
    })
   }
 }
 exports.get_sales = async (req, res) => {
    try {
        const { branch_code } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const sales = await sales_schema.find({ branch_code })
            .sort({ _id: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await sales_schema.countDocuments({ branch_code });

        res.status(200).json({
            status: 'success',
            total,
            page: Number(page),
            data: sales
        });
    } catch (error) {
        res.status(500).json({ status: 'failure', message: error.message });
    }
};

exports.search_products = async (req, res) => {
    try {
        const { branchid } = req.params;
        const { q } = req.query;

        if (!q || q.trim().length < 1) {
            return res.status(200).json({ status: 'success', products: [] });
        }
        if (!mongoose.Types.ObjectId.isValid(branchid)) {
            return res.status(400).json({ status: 'failure', message: 'invalid branch id' });
        }

        const branch_id = new mongoose.Types.ObjectId(branchid);

        // Search by product_name OR product_code — fuzzy prefix match
        const products = await product_data.find({
            branch_id,
            $or: [
                { product_name: { $regex: q, $options: 'i' } },
                { product_code: { $regex: q, $options: 'i' } },
            ]
        })
        .select('product_name product_code selling_price cost_price quantity')
        .limit(8)
        .lean();

        res.status(200).json({ status: 'success', products });
    } catch (error) {
        res.status(500).json({ status: 'failure', message: error.message });
    }
};