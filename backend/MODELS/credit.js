const mongoose = require('mongoose');

const credit_schema = mongoose.Schema({
    
    customer_code:{
        type:String,
        required:true,
        index:true
    },
    customer_phonenumber:{
        type:Number,
    },
    branchid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Branches',
        index:true
    },
    credit_code:{
        type:String,
        required:true,
    },
    items:[
          {
            product_code:{
                type:String,
                ref:'Products_Data',
                required:true
            },
            quantity:{
                type:Number,
                required:true,
            },
            price_per_unit:{
                type:Number,
                required:true
            },
            total_cost:{
                type:Number,
                required:true
            }
          }
    ],
    total_amount:{
        type:Number,
        required:true
    },
    idempotency_key:{
        type:String,
        required:true,
        unique:true,
        sparse:true
    },
    credit_state:{
        type:String,
        enum:['ACTIVE','CANCELLED'],
        default:'ACTIVE',
        index:true
    },
    status:{
        type:String,
        enum:['settled','unsettled','partial-settled'],
        default:'unsettled'
    },
    update_in_progress:{
        type:Boolean,
        default:false,
        index:true
    },
    amount_paid:{
        type:Number,
        default:0
    },
    remaining_amount:{
        type:Number,
        required:true,
        default:function() {
            return this.total_amount;
        }
    },
    
    risk_suggestion:{
        decision:       { type: String, enum: ['APPROVE', 'REVIEW', 'DENY', 'UNAVAILABLE'], default: 'UNAVAILABLE' },
        risk_score:     { type: Number, default: null },
        risk_label:     { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', null], default: null },
        recommendation: { type: String, default: null }, 
            history_summary: {
            total_credits:      { type: Number, default: null },
            total_defaults:     { type: Number, default: null },
            total_late:         { type: Number, default: null },
            repayment_ratio:    { type: Number, default: null },
            avg_delay_days:     { type: Number, default: null },
            outstanding_amount: { type: Number, default: null },
        }
    }

},{timestamps:true})

credit_schema.index({credit_code:1,credit_state:1});
credit_schema.index({credit_state:1,update_in_progress:1});
credit_schema.index({customer_code:1,credit_state:1,remaining_amount:1,createdAt:1});
module.exports = mongoose.model('credit_data',credit_schema);