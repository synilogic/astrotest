import WalletModel from '../../_models/wallet.js';

export async function processPaymentUpdate(data) {
  console.log('🔄 Starting payment update process:', {
    orderId: data.order_id,
    paymentId: data.payment_id,
    status: data.order_status,
    method: data.payment_method,
    timestamp: new Date().toISOString()
  });

  try {
    const { order_id, payment_id, order_status } = data;

    if (!order_id || !order_status) {
      console.log('❌ Missing required fields:', { order_id, order_status });
      return { status: 0, msg: "Missing required fields: order_id or order_status" };
    }

    const statusMap = {
      Success: 1,
      Failed: 2,
      Declined: 3,
    };

    const mappedStatus = statusMap[order_status] ?? 0;
    console.log('📊 Status Mapping:', {
      originalStatus: order_status,
      mappedStatus: mappedStatus
    });

    console.log('🔍 Finding wallet entry for order_id:', order_id);
    const wallet = await WalletModel.findOne({ where: { gateway_order_id: order_id } });

    if (!wallet) {
      console.log('❌ No wallet entry found for order_id:', order_id);
      return { status: 0, msg: "No wallet entry found for this order" };
    }

    console.log('�� Found wallet entry:', {
      walletId: wallet.id,
      userId: wallet.user_uni_id,
      currentStatus: wallet.status,
      amount: wallet.amount
    });

    if (wallet.status === 1) {
      console.log('⚠️ Payment already marked as successful for wallet:', wallet.id);
      return { status: 1, msg: "Payment already marked as successful" };
    }

    console.log('🔄 Updating wallet status...');
    await WalletModel.update(
      {
        status: mappedStatus,
        gateway_payment_id: payment_id,
      },
      {
        where: { gateway_order_id: order_id },
      }
    );

    const statusMsgMap = {
      1: "Recharge Successfully",
      2: "Payment Failed",
      3: "Payment Declined",
      0: "Unknown Payment Status",
    };

    const result = {
      status: 1,
      msg: statusMsgMap[mappedStatus],
    };

    console.log('✅ Wallet update completed:', {
      walletId: wallet.id,
      newStatus: mappedStatus,
      paymentId: payment_id,
      result: result
    });

    return result;

  } catch (error) {
    console.error('💥 Error processing payment update:', {
      error: error.message,
      stack: error.stack,
      data: data,
      timestamp: new Date().toISOString()
    });
    return { status: 0, msg: "Internal server error while processing payment" };
  }
}
