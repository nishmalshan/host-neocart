const cart = require("../model/cartSchema");
const product = require("../model/productSchema");
const user = require("../model/user");
const helpers = require("./helpers");
const orders = require("../model/orderSchema");
const coupons = require('../model/couponSchema');
const { ObjectId } = require("mongodb");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const path = require('path');
const { createInvoice, addCustomerInformation, addHeader, addInvoiceTable, addLogo, addTotals } = require('../service/PDFDocument');
const { RAZORPAY_KEY_ID, RAZORPAY_SECRET_KEY } = process.env;

let razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

// get method for order confirmation

const orderConfirmation = (req, res) => {
  try {
    res.render("./user/orderConfirmation");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



// post method for apply coupon 

const applyCoupon = async (req, res) => {
  try {
      const { couponCode } = req.body;
      console.log(couponCode, 'couponCode');

      // Find the coupon by code
      const findCoupon = await coupons.findOne({ couponCode: couponCode });

      if (findCoupon) {
          console.log(findCoupon,'fffffffffffccccccccccc');
          const couponId = findCoupon._id;

          // Check if the coupon has already been used in any order
          const alreadyUsedCoupon = await orders.findOne({ coupons: couponId });

          console.log(alreadyUsedCoupon,'aaaaaaaaaaaaallllllllllll');
          if (alreadyUsedCoupon === null) {
              
              const couponData = {
                  couponId: couponId,
                  minPurchaseAmount: findCoupon.minPurchaseAmount,
                  maxPurchaseAmount: findCoupon.maxPurchaseAmount,
                  discountAmount: findCoupon.discountAmount
              }
              let grandTotal = parseInt((req.session.totalAmount * couponData.discountAmount) / 100);
              req.session.couponData = couponData;
              console.log(req.session);
              
              return res.status(200).json({ success: true, message: 'Coupon applied', coupon: findCoupon, grandTotal });
          } else {
            console.log('coupon already used');
            return res.json({ success: false, message: 'Coupon already used' });
          }
      } else {
          return res.json({ success: false, message: 'Coupon not found' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


// patch method for remove coupon 

const removeCoupon = (req, res) => {
  try {
    const couponCode = req.body.couponCode;

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    // Clear the coupon data from the session
    req.session.couponData = null;
    console.log(req.session);

    res.json({ success: true, message: "Coupon removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred while removing the coupon" });
  }
};






// post method for place order

const placeOrder = async (req, res) => {
  try {
    const User = await user.findOne({ email: req.session.email });

    if (!User) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userId = User._id;
    const selectedAddressId = req.body.address;
    const paymentMethod = req.body.paymentMethod;
    console.log(paymentMethod,'payment method');

    if (!User.address || User.address.length === 0) {
      return res.status(400).json({ success: false, message: "No addresses found for user" });
    }

    const selectedAddress = User.address.find((x) => x._id == selectedAddressId );

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: "Selected address not found" });
    }

    const totalAmount = req.session.totalAmount;

    if (totalAmount < 0 || totalAmount == undefined) {
      return res.status(400).json({ success: false, message: "Invalid total amount" });
    }
    const couponData = req.session.couponData;
    console.log(couponData,'ccccccccccccddddddddddddddd');
    let grandTotal = 0;
    console.log(grandTotal,'grandTotal');
    if (couponData && totalAmount > couponData.minPurchaseAmount) {
       grandTotal = parseInt((totalAmount * couponData.discountAmount) / 100);
       console.log(grandTotal,'if');
      } else {
        grandTotal = totalAmount
        console.log(grandTotal,'else');
      }
      
    const products = await helpers.getProductData(userId);
    console.log(products,'products');
    const orderDate = new Date();
    const arrivingDate = new Date(orderDate);
    arrivingDate.setDate(orderDate.getDate() + 4);
    
    if (paymentMethod === "COD" && grandTotal <= 1000) {
      return res.status(400).send({ success: false, message: "Cash on delivery is only applicable for orders above 1000 rupees." });
      } 

    const items = products.map((productItem) => ({
      productId: productItem.item,
      name: productItem.product.name,
      image: productItem.product.images[0],
      price: productItem.discountAmount ? productItem.discountAmount : productItem.product.price,
      size: productItem.size,
      quantity: productItem.quantity,
    }));

    const newOrder = new orders({
      userId,
      items,
      paymentMethod,
      // paymentStatus: "Pending",
      address: [
        {
          name: selectedAddress.name,
          address: selectedAddress.address,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          phone: selectedAddress.phone,
        },
      ],
      totalPrice: grandTotal,
      orderDate,
      arrivingDate,
    });

    const saveOrder = await newOrder.save();

    if (saveOrder) {
      console.log(saveOrder,'save order');
      await cart.findOneAndDelete({ userId });

      for (const item of products) {
        const { item: productId, size, quantity: purchasedQuantity } = item;
        await product.updateOne(
          { _id: productId, "variant.size": size },
          { $inc: { "variant.$.quantity": -purchasedQuantity } }
        );
      }

       // Clear coupon data from session
       req.session.couponData = null;
       
    }
    if (paymentMethod === "COD" ) {
      return res.json({ codSuccess: true, message: "Order placed successfully" });
    } else if (paymentMethod === "Online") {
      console.log("payment online");
      const options = {
        amount: grandTotal * 100,
        currency: "INR",
        receipt: saveOrder._id.toString(),
      };

      razorpayInstance.orders.create(options, (err, order) => {
        if (!err) {
          console.log(order,'order');
          res.status(200).send({
            online: true,
            msg: "Order Created",
            order_id: order.id,
            orderId: saveOrder._id,
            amount: order.amount,
            key_id: RAZORPAY_KEY_ID,
            product_name: saveOrder.items[0].name,
            contact: saveOrder.address[0].phone,
            name: saveOrder.address[0].name,
            email: req.session.email,
          });
        } else {
          res.status(400).send({ online: false, message: "Something went wrong" });
        }
      });
    } else if (paymentMethod === "Wallet") {
      User.wallet.balanceAmount -= grandTotal;
      User.wallet.transaction.push({
        amount: grandTotal,
        transactionType: "debit",
        description: "Payment for order",
        timestamp: new Date(),
      });
      await User.save();

      newOrder.paymentMethod = "Wallet";
      newOrder.paymentStatus = "Paid";
      await newOrder.save();
      res.json({ walletSuccess: true, message: "Order Success" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// post method for verify payment

const verifyPayment = async (req, res, next) => {
  try {
    console.log('11111111111111111111111111');
    const { orderId, order_id, payment_id, signature } = req.body;
    console.log('order_id', order_id);
    console.log('payment_id', payment_id);
    console.log('signature', signature);
    console.log('orderId', orderId);
    
    const shasum = crypto.createHmac("sha256", RAZORPAY_SECRET_KEY);
    shasum.update(`${order_id}|${payment_id}`);
    const digest = shasum.digest("hex");

    if (digest === signature) {
      console.log('yesssssssssssssssssssssss');
      const updateOrder = await orders.findOneAndUpdate(
        { _id: orderId }, // Use orderId instead of order_id here
        {
          paymentId: order_id,
          paymentMethod: "Razorpay",
          paymentStatus: "Paid",
        }
      )
      await updateOrder.save()
console.log(updateOrder,'updateOrder');
      if (updateOrder) {
        res.status(400).json({ success: true, message: "Payment verified successfully" });
      } else {
        res.json({ success: false, message: "Payment verified failed" });
      }
    } else {
      res.status(400).json({ success: false, message: "Invalid payment signature" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};




const pendingPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    console.log(req.body);
    console.log("payment online");
    const findOrder = await orders.findOne({ _id: orderId })
    console.log(findOrder,'find Order');
    console.log(req.session,'session');
      const options = {
        amount: findOrder.totalPrice * 100,
        currency: "INR",
        receipt: findOrder._id.toString(),
      };
      
      razorpayInstance.orders.create(options, (err, order) => {
        if (!err) {
          console.log(order,'order');
          res.status(200).send({
            success: true,
            msg: "Payment success",
            order_id: order.id,
            orderId: findOrder._id,
            amount: order.amount,
            key_id: RAZORPAY_KEY_ID,
            product_name: findOrder.items[0].name,
            contact: findOrder.address[0].phone,
            name: findOrder.address[0].name,
            email: req.session.email,
          });
        } else {
          res.status(400).send({ online: false, message: "Something went wrong" });
        }
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
}


// get method for order lists page

const orderList = async (req, res) => {
  try {
    const User = await user.findOne({ email: req.session.email });
    if (User) {
      const userId = User._id;
      const orderDetails = await orders.find({ userId }).sort({ orderDate: -1 });
      let i = 0;
      const cartCount = await helpers.getCartCount(req.session.email);
      res.render("./user/orderedList", { title: "order-List", User, orderDetails, cartCount, i });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// get method for order details page

const orderDetails = async (req, res) => {
  try {
    const User = await user.findOne({ email: req.session.email });
    const productId = req.params.id;
    const email = req.session.email;
    const cartCount = await helpers.getCartCount(req.session.email);
    if (!ObjectId.isValid(productId)) {
      return res.status(400).render("user/404");
    }

    const orderDetails = await orders.findOne({ _id: productId });

    res.render("./user/orderDetails", { title: "order-Details", User, orderDetails, cartCount, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// post method for cancel order

const cancelOrder = async (req, res) => {
  try {
    const id = req.body.orderId;

    const orderData = await orders.findById(id);

    if (orderData.status !== "Delivered") {
      orderData.status = "Cancelled";
      orderData.reason = req.body.cancellationReason;

      if (
        orderData.paymentMethod === "Razorpay" && orderData.paymentStatus === "Paid" ||
        orderData.paymentMethod === "Wallet"
      ) {
        console.log('yoooooooooooooooooooooo');
        const userData = await user.findOne({ email: req.session.email });
        userData.wallet.balanceAmount += parseInt(orderData.totalPrice);
        userData.wallet.transaction.push({
          amount: parseInt(orderData.totalPrice),
          transactionType: "credit",
          timestamp: new Date(),
          description: "Order cancellation refund",
        });
        await userData.save();
      }
      await orderData.save();

      for (const item of orderData.items) {
        if (item.productId) {
          const productData = await product.findById(item.productId);

          if (productData) {
            const variant = productData.variant.find(
              (variant) => variant.size === item.size
            );

            if (variant) {
              variant.quantity += item.quantity;
              await productData.save();
            }
          }
        }
      }

      res.json({ success: true, message: "Order has been cancelled" });
    } else {
      res.json({
        success: false,
        message: "Cannot cancel the delivered order",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// patch method for return order

const returnOrder = async (req, res) => {
  try {
    const { orderId, itemId, reason } = req.body;

    const update = await orders.updateOne(
      { _id: orderId, "items._id": itemId },
      {
        $set: {
          "items.$.status": "Requested for return",
          "items.$.returnReason": reason,
        },
      }
    );

    if (update) {
      res.status(200).json({ success: true, message: "Order has been returned" });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};





// post method for generate invoice 

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    console.log(orderId, 'order Id');

    const order = await orders.findById(orderId).populate('items.productId').exec();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-disposition', `attachment; filename=invoice_${order._id}.pdf`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    addLogo(doc);
    addHeader(doc, order);
    addCustomerInformation(doc, order);
    addInvoiceTable(doc, order);
    addTotals(doc, order);

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};











module.exports = {
  applyCoupon,
  removeCoupon,
  placeOrder,
  verifyPayment,
  pendingPayment,
  orderConfirmation,
  orderList,
  orderDetails,
  cancelOrder,
  returnOrder,
  generateInvoice
};
