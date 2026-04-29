const CreditTransaction = require('../MODELS_ML/credit_transaction');
const ProductSaleTransaction = require('../MODELS_ML/product_sale_transaction');
const customer = require('../MODELS/customer')
const { enrichTransaction } = require('./etl_utils');

// ─────────────────────────────────────────────
// CREDIT CREATION
// ─────────────────────────────────────────────
exports.handleCreditCreate = async (creditDoc, branch_code, business_code) => {

    const now = new Date();
     const customer_code = creditDoc.customer_code;
     const customer_phone_number = await customer.findOne({customer_code}).select("customer_phonenumber").lean();
     const phone_number = Number(customer_phone_number?.customer_phonenumber);
     console.log("phone number->",phone_number)
     const enriched = await enrichTransaction(
        now,
        phone_number,
        business_code
    );

    await CreditTransaction.create({
        credit_code: creditDoc.credit_code,

        phoneNumber: phone_number,
        branch_code,
        business_code,

        creditAmount: creditDoc.total_amount,
        amountPaid: 0,
        remainingAmount: creditDoc.total_amount,

        creditIssuedDate: now,
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),

        paymentStatus: 'UNPAID',

        issuedDayOfWeek: enriched.dayOfWeek,
        issuedMonth: enriched.month,

        festivalPeriod: enriched.festivalPeriod,
        salaryWeek: enriched.salaryWeek,
        repaymentRatio:0,
        creditUtilisation:1
    });
};

// ─────────────────────────────────────────────
// PAYMENT UPDATE
// ─────────────────────────────────────────────
// exports.handlePaymentUpdate = async (creditDoc, amount) => {

//     const now = new Date();

//     const mlDoc = await CreditTransaction.findOne({
//         credit_code: creditDoc.credit_code
//     });

//     if (!mlDoc) return;

//     const newPaid = mlDoc.amountPaid + amount;
//     const remaining = mlDoc.creditAmount - newPaid;

//     const days = Math.floor(
//         (now - mlDoc.creditIssuedDate) / (1000 * 60 * 60 * 24)
//     );

//     await CreditTransaction.updateOne(
//         { credit_code: creditDoc.credit_code },
//         {
//             $set: {
//                 amountPaid: newPaid,
//                 remainingAmount: remaining,
//                 paymentCount: mlDoc.paymentCount + 1,

//                 paymentStatus:
//                     remaining === 0 ? 'PAID' :
//                     newPaid > 0 ? 'PARTIAL' : 'UNPAID',

//                 lastPaymentUpdate: now,

//                 daysToFirstPayment:
//                     mlDoc.amountPaid === 0 ? days : mlDoc.daysToFirstPayment,

//                 totalDaysToRepay:
//                     remaining === 0 ? days : mlDoc.totalDaysToRepay,

//                 delayDays:
//                     now > mlDoc.dueDate
//                         ? Math.floor((now - mlDoc.dueDate)/(1000*60*60*24))
//                         : 0,

//                 wasLate: now > mlDoc.dueDate,
//                 wasDefault: remaining > 0 && now > mlDoc.dueDate
//             }
//         }
//     );
// };

exports.handlePaymentUpdate = async (creditDoc, amount) => {

    const now = new Date();

    const mlDoc = await CreditTransaction.findOne({
        credit_code: creditDoc.credit_code
    });

    if (!mlDoc) return;

    const newPaid = mlDoc.amountPaid + amount;
    const remaining = mlDoc.creditAmount - newPaid;

    const diffMs = now - mlDoc.creditIssuedDate;

    
    const daysSinceIssued = Number(
        (diffMs / (1000 * 60 * 60 * 24)).toFixed(2)
    );

    
    const delayDays = now > mlDoc.dueDate
        ? Number(((now - mlDoc.dueDate) / (1000 * 60 * 60 * 24)).toFixed(2))
        : 0;

    await CreditTransaction.updateOne(
        { credit_code: creditDoc.credit_code },
        {
            $set: {
                amountPaid: newPaid,
                remainingAmount: remaining,
                paymentCount: mlDoc.paymentCount + 1,

                paymentStatus:
                    remaining === 0 ? 'PAID' :
                    newPaid > 0 ? 'PARTIAL' : 'UNPAID',

                lastPaymentUpdate: now,

                //  first payment only once
                daysToFirstPayment:
                    mlDoc.amountPaid === 0
                        ? daysSinceIssued
                        : mlDoc.daysToFirstPayment,

                //  only when fully paid
                totalDaysToRepay:
                    remaining === 0
                        ? daysSinceIssued
                        : mlDoc.totalDaysToRepay,

                delayDays,

                
                wasLate: now > mlDoc.dueDate,

                
                wasDefault:
                    remaining > 0 &&
                    delayDays > 30 ,  // configurable threshold

                repaymentRatio:    parseFloat((newPaid   / mlDoc.creditAmount).toFixed(4)),
                creditUtilisation: parseFloat((remaining / mlDoc.creditAmount).toFixed(4)),    
            }
        }
    );
};

// ─────────────────────────────────────────────
// SALES TRANSACTION
// ─────────────────────────────────────────────
exports.handleSale = async (salesData, beforeStockMap, branch_code, business_code) => {

    const now = new Date();

    const enriched = await enrichTransaction(
        now,
        null,
        business_code
    );

    for (let item of salesData.items) {

        const before = beforeStockMap.get(item.product_code);

        await ProductSaleTransaction.create({
            product_code: item.product_code,
            branch_code,
            business_code,

            quantitySold: item.quantity,
            unitPrice: item.total_cost / item.quantity,
            totalSaleAmount: item.total_cost,

            stockBeforeSale: before,
            stockAfterSale: before - item.quantity,

            saleDate: now,

            ...enriched
        });
    }
};