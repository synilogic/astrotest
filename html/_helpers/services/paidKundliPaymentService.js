import PaidKundliOrder from '../../_models/paidKundliOrderModel.js';
import { PaidKundliManualOrder } from '../../_models/paidKundliManualOrderModel.js';
import User from '../../_models/users.js';
import Customer from '../../_models/customers.js';
import  horoscopePDF  from '../JyotishamAstro.js';
import  vedicHoroscopePDF  from '../VedicAstro.js';
import path from 'path';
import fs from 'fs';
import moment from 'moment';

export async function processPaidKundliPaymentUpdate(data) {
  try {
    const { order_id, payment_id, order_status } = data;

    if (!order_id || !order_status) {
      return { status: 0, msg: "Missing required fields: order_id or order_status" };
    }

    const statusMap = {
      Success: 1,
      Failed: 2,
      Declined: 3,
    };

    const mappedStatus = statusMap[order_status] ?? 0;

    // Check for PaidKundliOrder
    const paidKundliOrder = await PaidKundliOrder.findOne({ 
      where: { order_id } 
    });

    // Check for PaidKundliManualOrder
    const paidKundliManualOrder = await PaidKundliManualOrder.findOne({ 
      where: { order_id } 
    });

    if (!paidKundliOrder && !paidKundliManualOrder) {
      return { status: 0, msg: "No paid kundli order found for this order_id" };
    }

    let orderToUpdate = paidKundliOrder || paidKundliManualOrder;
    const isManualOrder = !!paidKundliManualOrder;

    if (orderToUpdate.payment_status === 1) {
      return { status: 1, msg: "Payment already marked as successful" };
    }

    // Update payment status
    const updateData = {
      payment_status: mappedStatus,
      status: mappedStatus === 1 ? 1 : 0,
      updated_at: new Date(),
    };

    if (isManualOrder) {
      await PaidKundliManualOrder.update(updateData, {
        where: { order_id },
      });
    } else {
      await PaidKundliOrder.update(updateData, {
        where: { order_id },
      });
    }

    // If payment is successful, generate PDF
    if (mappedStatus === 1) {
      try {
        await generateKundliPDF(orderToUpdate, isManualOrder);
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Don't fail the payment update if PDF generation fails
      }
    }

    const statusMsgMap = {
      1: "Payment Successful - PDF Generated",
      2: "Payment Failed",
      3: "Payment Declined",
      0: "Unknown Payment Status",
    };

    return {
      status: 1,
      msg: statusMsgMap[mappedStatus],
    };

  } catch (error) {
    console.error("Error processing paid kundli payment update:", error);
    return { status: 0, msg: "Internal server error while processing payment" };
  }
}

async function generateKundliPDF(order, isManualOrder) {
  try {
    // Get user data
    const user = await User.findOne({
      where: { user_uni_id: order.user_uni_id },
      include: [{ model: Customer, as: 'customer', required: false }],
      raw: true,
      nest: true,
    });

    if (!user || !user.customer) {
      throw new Error('User or customer data not found');
    }

    const customer = user.customer;
    
    // Check if required kundli data exists
    if (!customer.dob || !customer.tob || !customer.lat || !customer.lon) {
      throw new Error('Incomplete kundli data for PDF generation. Please ensure date of birth, time of birth, latitude, and longitude are provided.');
    }

    // Determine PDF type based on order_for
    let pdfType = 'horoscope';
    if (order.order_for === 'matching') {
      pdfType = 'matching';
    } else if (order.order_for === 'horoscope') {
      pdfType = 'horoscope';
    }

    // Prepare data for PDF generation
    const pdfData = {
      name: customer.name || user.name || 'User',
      dob: customer.dob,
      tob: customer.tob,
      lat: customer.lat,
      lon: customer.lon,
      tz: customer.tz || '5.5',
      lang: 'en',
      style: 'north',
      pob: customer.pob || customer.place_of_birth || '',
      pdf_type: pdfType,
    };

    // Generate PDF using available services
    let pdfResponse = null;
    
    try {
      // Try Jyotisham API first
      pdfResponse = await horoscopePDF(pdfData);
    } catch (error) {
      console.log('Jyotisham API failed, trying VedicAstro API');
      try {
        // Fallback to VedicAstro API
        pdfResponse = await vedicHoroscopePDF(pdfData);
      } catch (vedicError) {
        throw new Error('Both PDF generation services failed. Please try again later.');
      }
    }

    if (!pdfResponse || !pdfResponse.status || pdfResponse.status !== 1) {
      throw new Error('PDF generation failed. Please try again later.');
    }

    // Save PDF file
    const fileName = `kundli_${order.order_id}_${Date.now()}.pdf`;
    const pdfPath = isManualOrder ? 'paid_kundli_manual_pdf' : 'paid_kundli_pdf';
    const fullPath = path.join(process.cwd(), 'public', pdfPath, fileName);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save PDF content
    if (pdfResponse.pdf_content) {
      // If PDF content is base64
      const pdfBuffer = Buffer.from(pdfResponse.pdf_content, 'base64');
      fs.writeFileSync(fullPath, pdfBuffer);
    } else if (pdfResponse.pdf_url) {
      // If PDF URL is provided, download it
      const response = await fetch(pdfResponse.pdf_url);
      const pdfBuffer = await response.arrayBuffer();
      fs.writeFileSync(fullPath, Buffer.from(pdfBuffer));
    } else {
      throw new Error('No PDF content or URL received from generation service.');
    }

    // Update order with PDF file path
    const updateData = {
      pdf_file: fileName,
      updated_at: new Date(),
    };

    if (isManualOrder) {
      await PaidKundliManualOrder.update(updateData, {
        where: { order_id: order.order_id },
      });
    } else {
      await PaidKundliOrder.update(updateData, {
        where: { order_id: order.order_id },
      });
    }

    console.log(`PDF generated successfully for order ${order.order_id}: ${fileName}`);

  } catch (error) {
    console.error('Error generating kundli PDF:', error);
    throw error;
  }
} 