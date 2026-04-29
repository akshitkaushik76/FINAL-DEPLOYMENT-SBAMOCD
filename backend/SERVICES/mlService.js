// SERVICES/mlService.js
const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// timeout for training (can take 30s), short for predictions
const trainClient   = axios.create({ baseURL: ML_URL, timeout: 120000 });
const predictClient = axios.create({ baseURL: ML_URL, timeout: 15000 });

// ── DEMAND ────────────────────────────────────────────────────

exports.trainDemandModel = async (branch_code, business_code) => {
    const res = await trainClient.post('/demand/train', null, {
        params: { branch_code, business_code }
    });
    return res.data;
};

exports.getRestock = async (branch_code, days = 7) => {
    const res = await predictClient.get('/demand/restock', {
        params: { branch_code, days }
    });
    return res.data;
};

exports.getDemandModelStatus = async (branch_code) => {
    const res = await predictClient.get('/demand/status', {
        params: { branch_code }
    });
    return res.data;
};

// ── CREDIT ────────────────────────────────────────────────────

exports.trainCreditModel = async (branch_code, business_code) => {
    const res = await trainClient.post('/credit/train', null, {
        params: { branch_code, business_code }
    });
    return res.data;
};

exports.assessCredit = async (credit_code) => {
    const res = await predictClient.post('/credit/assess', { credit_code });
    return res.data;
};

exports.getHighRisk = async (branch_code, threshold = 0.65) => {
    const res = await predictClient.get('/credit/high-risk', {
        params: { branch_code, threshold }
    });
    return res.data;
};

exports.precheckCredit = async (payload) => {
    const res = await predictClient.post('/credit/precheck', payload);
    return res.data;
};

exports.getCreditModelStatus = async (branch_code) => {
    const res = await predictClient.get('/credit/status', {
        params: { branch_code }
    });
    return res.data;
};

// ── HEALTH ────────────────────────────────────────────────────

exports.healthCheck = async () => {
    const res = await predictClient.get('/health');
    return res.data;
};