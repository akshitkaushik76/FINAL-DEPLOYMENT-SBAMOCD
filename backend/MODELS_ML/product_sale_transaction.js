const mongoose = require('mongoose');

const ProductSaleTransactionSchema = new mongoose.Schema({

    product_code: { type: String, required: true, index: true },
    branch_code: { type: String, required: true, index: true },
    business_code: { type: String, required: true, index: true },

    quantitySold: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalSaleAmount: { type: Number, required: true },

    stockBeforeSale: Number,
    stockAfterSale: Number,

    saleDate: { type: Date, default: Date.now },

    dayOfWeek: Number,
    weekOfMonth: Number,
    month: Number,
    season: {
        type: String,
        enum: ['WINTER', 'SUMMER', 'MONSOON']
    },

    isWeekend: Boolean,
    festivalPeriod: Boolean,
    salaryWeek: Boolean,

    createdAt: { type: Date, default: Date.now }

});

ProductSaleTransactionSchema.index({
    product_code: 1,
    branch_code: 1,
    saleDate: 1
});

module.exports = mongoose.model('ProductSaleTransaction', ProductSaleTransactionSchema);