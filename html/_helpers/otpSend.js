import axios from "axios";
import dotenv from 'dotenv';
import { ROLE_IDS ,configData} from '../_config/constants.js';
dotenv.config();



export async function customSendSms(c_number, c_otp) {
  console.log("mahesh",c_number,c_otp);
  try {
        
    // Simulate your Laravel config values
    const smsUrlTemplate =
      configData.custom_sms_url;
    const smsMessageTemplate = configData.custom_sms_message;
         console.log(smsUrlTemplate,smsMessageTemplate);
    // Remove country code if exists
    c_number = c_number.replace("+91", "");

    // Replace variables in message
    const replacements = {
      "#MOBILENO#": c_number || "",
      "#OTP#": c_otp || "",
      "#MESSAGE#": smsMessageTemplate || ""
    };
      console.log(replacements);
    let message = smsMessageTemplate.replace(
      /#MOBILENO#|#OTP#|#MESSAGE#/g,
      (matched) => replacements[matched]
    );
    const encodedMessage = encodeURIComponent(message);

    // Replace message in final URL
    const urlReplacements = {
      "#MOBILENO#": c_number,
      "#OTP#": c_otp,
      "#MESSAGE#": encodedMessage
    };
    const finalUrl = smsUrlTemplate.replace(
      /#MOBILENO#|#OTP#|#MESSAGE#/g,
      (matched) => urlReplacements[matched]
    );
    console.log("final url", finalUrl);
    // Send request
    const response = await axios.get(finalUrl);
  
    return {
      status: 1,
      msg: response.data
    };
  } catch (error) {
    return {
      status: 0,
      msg: error.message
    };
  }
}

export async function sendDltSms(c_number, c_message) {
  try {

   //  console.log("phone number",c_number);
    const fields = {
      route: process.env.ROUTE || "dlt",
      sender_id: process.env.SENDER_ID || "SYITPL",
      message: process.env.SMS_TEMPLATE_ID || 181789,
      flash: 0,
      numbers: c_number,
      variables_values: `${c_message}|`
    };
 

    const url = process.env.SMS_URL || "https://www.fast2sms.com/dev/bulkV2";

    const headers = {
      Authorization:
        process.env.AUTH_KEY || "ngXkObl2xD13t5ziQIvSo8AZyJURdjqmwF0Bc4pK69PhGsYE7aW4bLejqO3VUFngmJlAvTsG9QSkaMd8",
      "Content-Type": "application/json"
    };

    const response = await axios.post(url, fields, { headers });
      
      console.log("resposne",response);
    return {
      status: 1,
      msg: response.data
    };
  } catch (error) {
    console.error("Error in sendDltSms:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });

    return {
      status: 0,
      msg: error.response?.data || error.message
    };
  }
}
