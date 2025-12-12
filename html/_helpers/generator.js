// _helpers/generator.js

export function generateOrderId(prefix = 'ORD') {
  const timestamp = Date.now(); // milliseconds since epoch
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `${prefix}${timestamp}${randomPart}`;
}

export function generateNDigitRandomNumber(n = 6) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
