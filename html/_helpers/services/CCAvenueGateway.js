import crypto from 'crypto';
import { getConfig } from '../../configStore.js';

class CCAvenueGateway {
  constructor() {
    this.parameters = {};
    this.merchantData = '';
    this.encRequest = '';
    this.testEndPoint = 'https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction';
    this.liveEndPoint = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';

    this.testMode = true;
    this.workingKey = '';
    this.accessCode = '';
  }

  async init() {
    this.testMode = (await getConfig('ccavenue_live_mode')) !== '1';
    this.workingKey = await getConfig('ccavenue_working_key');
    this.accessCode = await getConfig('ccavenue_access_code');

    this.parameters = {
      merchant_id: await getConfig('ccavenue_merchant_id'),
      currency: await getConfig('ccavenue_currency'),
      redirect_url: '',
      cancel_url: '',
      language: await getConfig('ccavenue_language'),
    };
  }

  getEndPoint() {
    return this.testMode ? this.testEndPoint : this.liveEndPoint;
  }

  async request(extraParams) {
    Object.assign(this.parameters, extraParams);

    this.merchantData = Object.entries(this.parameters)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    this.encRequest = this.encrypt(this.merchantData, this.workingKey);
    return this;
  }

  encrypt(plainText, key) {
    const md5Key = crypto.createHash('md5').update(key).digest('hex');
    const binKey = this.hextobin(md5Key);
    const iv = Buffer.from([...Array(16).keys()]);
    const cipher = crypto.createCipheriv('aes-128-cbc', binKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  decrypt(encText, key) {
    const md5Key = crypto.createHash('md5').update(key).digest('hex');
    const binKey = this.hextobin(md5Key);
    const iv = Buffer.from([...Array(16).keys()]);
    const encryptedBuffer = this.hextobin(encText);
    const decipher = crypto.createDecipheriv('aes-128-cbc', binKey, iv);
    let decrypted = decipher.update(encryptedBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  hextobin(hex) {
    return Buffer.from(hex, 'hex');
  }

  response(encResp) {
    const decrypted = this.decrypt(encResp, this.workingKey);
    const responseData = {};
    decrypted.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      responseData[key] = value;
    });
    return responseData;
  }
}

export default CCAvenueGateway;
