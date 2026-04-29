const mongoose = require('mongoose');

const CreditTransactionSchema = new mongoose.Schema({

    credit_code: { type: String, required: true, unique: true, index: true },

    phoneNumber: { type: Number, required: true, index: true },
    branch_code: { type: String, required: true, index: true },
    business_code: { type: String, required: true, index: true },

    creditAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    creditIssuedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },

    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PARTIAL', 'PAID'],
        default: 'UNPAID'
    },

    paymentCount: { type: Number, default: 0 },

    daysToFirstPayment: { type: Number, default: null },
    totalDaysToRepay: { type: Number, default: null },
    delayDays: { type: Number, default: 0 },

    wasLate: { type: Boolean, default: false },
    wasDefault: { type: Boolean, default: false },

    issuedDayOfWeek: Number,
    issuedMonth: Number,
    festivalPeriod: Boolean,
    salaryWeek: Boolean,

    lastPaymentUpdate: Date,
    repaymentRatio:{type:Number, default:0},
    creditUtilisation:{type:Number,default:1},

    createdAt: { type: Date, default: Date.now }

});

CreditTransactionSchema.index({ phoneNumber: 1, creditIssuedDate: 1 });

module.exports = mongoose.model('CreditTransaction', CreditTransactionSchema);