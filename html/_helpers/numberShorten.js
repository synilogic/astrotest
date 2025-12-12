export const numberShorten   = (number, precision = 3, divisors = null)=>{
    // Set default divisors if not provided
    if (!divisors) {
      divisors = {
        [Math.pow(1000, 0)]: '',   // 1
        [Math.pow(1000, 1)]: 'K',  // Thousand
        [Math.pow(1000, 2)]: 'M',  // Million
        [Math.pow(1000, 3)]: 'B',  // Billion
        [Math.pow(1000, 4)]: 'T',  // Trillion
        [Math.pow(1000, 5)]: 'Qa', // Quadrillion
        [Math.pow(1000, 6)]: 'Qi', // Quintillion
      };
    }
  
    let divisor = 1;
    let shorthand = '';
  
    for (const [div, symbol] of Object.entries(divisors)) {
      if (Math.abs(number) < Number(div) * 1000) {
        divisor = Number(div);
        shorthand = symbol;
        break;
      }
    }
  
    // If no match, use the largest divisor
    if (divisor === 1 && Math.abs(number) >= 1000) {
      const keys = Object.keys(divisors).map(Number).sort((a, b) => b - a);
      divisor = keys[0];
      shorthand = divisors[divisor];
    }
  
    const shortened = (number / divisor).toFixed(precision);
    return `${shortened}${shorthand}`;
  }
  
export default numberShorten