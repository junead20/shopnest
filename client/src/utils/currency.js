// client/src/utils/currency.js
export const formatINR = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatINRSimple = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const convertToINR = (usdAmount) => {
  // Approximate conversion rate (you can make this dynamic later)
  const conversionRate = 83; // 1 USD ≈ 83 INR
  return usdAmount * conversionRate;
};