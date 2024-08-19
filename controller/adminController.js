const dbConnection = require("../config/connection");
const session = require("express-session");
const user = require("../model/user");
const orders = require("../model/orderSchema");
const dashboard = require("../controller/dashboard")
const product = require("../model/productSchema");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
// const pdf = require('html-pdf');
const PDFDocument = require('pdfkit');
const ejs = require('ejs');
// const puppeteer = require('puppeteer');
const credential = {
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
};

// get method for admin login page

const adminLoginPageGet = (req, res) => {
  try {
    res.render("./admin/adminloginpage", { title: "adminLogin" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// post method for admin login

const adminLoginPost = (req, res) => {
  try {
    const { email, password } = req.body;
    if (credential.email === email && credential.password === password) {
      req.session.email = req.body.email;
      req.session.adminlogged = true;
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//get method for admin dashboard

const adminDashboard = async (req, res) => {
  try {
    const totalUsers  = await dashboard.getTotalUsers();
    const totalOrders = await dashboard.getTotalOrders();
    const totalOrderedProduct = await dashboard.getTotalProductsSold();
    const recentOrders = await dashboard.getRecentOrders();
    const topSellingProducts = await dashboard.getTopSellingProducts();
    const topSellingCategories = await dashboard.getTopSellingCategories();
    const deliveredOrders = await orders.find({ status: "Delivered" });
    const selectedTimeInterval = req.body.interval || 'daily';


    let timeFormat, timeUnit, dateFormat;
        if (selectedTimeInterval === "monthly") {
          timeFormat = "%Y-%m";
          timeUnit = "$month";
          dateFormat = "MMMM YYYY";
        } else if (selectedTimeInterval === "yearly") {
          timeFormat = "%Y";
          timeUnit = "$year";
          dateFormat = "YYYY"
        } else {
          timeFormat = '%Y-%m-%d';
          timeUnit = "$dayOfMonth";
          dateFormat = "MMMM DD, YYYY"
        }

  
        const deliveredOrderIds = deliveredOrders.map(order => order._id);

        const orderWithDate = await dashboard.ordersWithDates(deliveredOrderIds, timeFormat);

      const validOrdersWithDate = orderWithDate.filter((order) => order.date && order.date !== null );
      
      const xValues = validOrdersWithDate.map((order) => order.date);
      const yValues = validOrdersWithDate.map((order) => order.count);

      const recentlyPlacedOrders = await orders
      .find()
      .sort({ orderDate: -1 })
      .populate("items.productId")
      .limit(5);

          res.render("./admin/admindashboard", {
            title: "adminhome",
            totalUsers,
            totalOrders,
            totalOrderedProduct,
            recentOrders,
            topSellingProducts,
            topSellingCategories,
            orders: deliveredOrders,
            xValues: JSON.stringify(xValues),
            yValues,
            recentlyPlacedOrders,
            selectedTimeInterval,
            dateFormat
          });


  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const salesReport = async (req, res) => {
  try {
    console.log('Generating sales report...');
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');
    
    const ordersData = await orders.find({
      orderDate: {
        $gte: formattedStartDate,
        $lte: formattedEndDate,
      },
      status: 'Delivered',
    }).populate('items.productId');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${startDate}_to_${endDate}.pdf`);

    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date Range: ${formattedStartDate} to ${formattedEndDate}`, { align: 'center' });
    doc.moveDown();

    const tableTop = 150;
    const tableLeft = 50;
    const tableRight = 550;
    const tableBottom = tableTop - 5 + (ordersData.length * 40) + 30;

    // Draw table border
    doc.rect(tableLeft, tableTop, tableRight - tableLeft, tableBottom - tableTop).stroke();

    // Adjusted column widths
    const colWidths = [30, 70, 100, 70, 120, 50, 60]; // Increased width of Total column
    let xPosition = tableLeft;

    doc.font('Helvetica-Bold').fontSize(10);

    // Draw header cells and center-align text
    ['S.No', 'Orders ID', 'Customer', 'Orders Date', 'Product', 'Quantity', 'Total'].forEach((header, i) => {
      doc.rect(xPosition, tableTop, colWidths[i], 25).stroke();
      doc.text(header, xPosition, tableTop + 7, {
        width: colWidths[i],
        align: 'center'
      });
      xPosition += colWidths[i];
    });

    let yPosition = tableTop + 25;
    doc.font('Helvetica').fontSize(9);
    
    let totalOrdersPrice = 0;
    
    ordersData.forEach((order, index) => {
      xPosition = tableLeft;
      
      // Draw row cells
      colWidths.forEach(width => {
        doc.rect(xPosition, yPosition, width, 40).stroke();
        xPosition += width;
      });

      xPosition = tableLeft;
      
      // Fill row data
      doc.text((index + 1).toString(), xPosition, yPosition + 15, { width: colWidths[0], align: 'center' });
      xPosition += colWidths[0];
      
      doc.text(order._id.toString().slice(-12), xPosition, yPosition + 15, { width: colWidths[1], align: 'center' });
      xPosition += colWidths[1];
      
      doc.text(order.address[0].name, xPosition + 5, yPosition + 5, { 
        width: colWidths[2] - 10, 
        height: 30, 
        align: 'left'
      });
      xPosition += colWidths[2];
      
      doc.text(moment(order.orderDate).format('YYYY-MM-DD'), xPosition, yPosition + 15, { width: colWidths[3], align: 'center' });
      xPosition += colWidths[3];
      
      let productText = order.items.map(item => item.productId.name).join(', ');
      doc.text(productText, xPosition + 5, yPosition + 5, { 
        width: colWidths[4] - 10, 
        height: 30, 
        align: 'left'
      });
      xPosition += colWidths[4];
      
      let quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
      doc.text(quantity.toString(), xPosition, yPosition + 15, { width: colWidths[5], align: 'center' });
      xPosition += colWidths[5];
      
      // Added more right space for Total column
      doc.text(`₹${order.totalPrice.toFixed(2)}/-`, xPosition + 5, yPosition + 15, { 
        width: colWidths[6] - 15, 
        align: 'right'
      });
      
      totalOrdersPrice += order.totalPrice;
      yPosition += 40;
    });

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`Total Orders Price: ₹${totalOrdersPrice.toFixed(2)}/-`, tableRight - 200, tableBottom + 10, { width: 200, align: 'right' });

    doc.end();

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send("Internal Server Error");
  }
};



// list the users who signed Up

const userManagement = async (req, res) => {
  try {
    let i = 0;
    const userData = await user.find();

    res.render("./admin/usermanagement", { title: "usermanagement", userData, i });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Blocking users

const blockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const block = await user.updateOne(
      { _id: id },
      { $set: { status: false } }
    );

    res.redirect("/admin/userList");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// Unblocking users

const unblockUser = async (req, res) => {
  try {
    const id = req.params.id;

    const unblock = await user.updateOne(
      { _id: id },
      { $set: { status: true } }
    );
    res.redirect("/admin/userList");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// post method for admin logout

const adminLogoutPost = (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};





// -------------------------------- Admin side order management ----------------------------- //



// get method for order management

const getOrderManagement = async (req, res) => {
  try {
    let i = 0;
    const orderedDetails = await orders.find().sort({ orderDate: -1 });
    res.render("./admin/ordermanage", {
      title: "order-management",
      orderedDetails,
      i,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// post method for update order status 

const updateUserOrderStatus = async (req, res) => {
  try {
    const newStatus = req.body.status;
    const orderId = req.params.orderId;
    // console.log(newStatus,'nnnnnnnnssssssssssss');
    // console.log(orderId,'ooooooooooiiiiiiiiiiiiiiiii');

    const updateStatus = await orders.findByIdAndUpdate(orderId, {
      status: newStatus,
    });

    if (updateStatus) {
      // console.log(updateStatus,'uuuuuuuuuuuuuuuuuuuuu');
      res.json({ success: true, message: "Order status updated successfully" });
    } else {
      res.json({ success: false, message: "Failed to update order status" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};





// get method for return management page

const getReturnManagement = async (req, res) =>{
  try {
    const orderedDetails = await orders.find().sort({ orderDate: -1 });
    res.render('./admin/returnmanage', { title: 'order-manage', orderedDetails })

  } catch (error) {
  console.error(error);
  res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}



// post method for update return status

const updateReaturnOrderStatus = async (req, res) => {
  try {
    const { status, orderId, itemId } = req.body;

    const productData = await orders.findById(orderId);
    if (productData) {
      for (const item of productData.items) {
        if (item.id === itemId) {
          item.status = status;
        }
      }
      productData.status = 'Returned';
      await productData.save();

      const orderData = await orders.findById(orderId);
      if (orderData && orderData.items) {
        for (const data of orderData.items) {
          if (data.status === "Accepted") {

            const userData = await user.findOne({ _id: orderData.userId });
            if (!userData) {
              return res.status(404).json({ success: false, message: 'User not found' });
            }

            userData.wallet.balanceAmount += parseInt(orderData.totalPrice);
            userData.wallet.transaction.push({
              amount: parseInt(orderData.totalPrice),
              transactionType: "credit",
              timestamp: new Date(),
              description: "Refund for returned order item",
            });
            await userData.save();

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
          }
        }
      }
      res.status(200).json({ success: true, message: 'Order Returned Successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Product data not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}






















module.exports = {
  adminLoginPageGet,
  adminLoginPost,
  adminDashboard,
  salesReport,
  userManagement,
  blockUser,
  unblockUser,
  adminLogoutPost,
  getOrderManagement,
  updateUserOrderStatus,
  getReturnManagement,
  updateReaturnOrderStatus
};
