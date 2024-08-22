const user = require("../model/user");
const orders = require("../model/orderSchema");
const dashboard = require("../controller/dashboard")
const product = require("../model/productSchema");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
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
    const format = req.query.format;

    const formattedStartDate = moment(startDate).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate).format('YYYY-MM-DD');

    const ordersData = await orders.find({
      orderDate: {
        $gte: formattedStartDate,
        $lte: formattedEndDate,
      },
      status: 'Delivered',
    }).populate('items.productId');

    if (format === 'pdf') {
      await generatePDFReport(res, ordersData, formattedStartDate, formattedEndDate);
    } else if (format === 'excel') {
      await generateExcelReport(res, ordersData, formattedStartDate, formattedEndDate);
    } else {
      res.status(400).send('Invalid format specified');
    }

  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).send("Internal Server Error");
  }
};

async function generatePDFReport(res, ordersData, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=sales_report_${startDate}_to_${endDate}.pdf`);

  doc.pipe(res);

  doc.fontSize(18).text('Sales Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
  doc.moveDown();

  const tableTop = 150;
  const tableLeft = 50;
  const tableRight = 550;
  const rowHeight = 30;
  const tableBottom = tableTop + (ordersData.length + 1) * rowHeight;

  doc.rect(tableLeft, tableTop, tableRight - tableLeft, tableBottom - tableTop).stroke();

  const colWidths = [30, 70, 100, 70, 120, 50, 60];
  let xPosition = tableLeft;

  doc.font('Helvetica-Bold').fontSize(10);

  ['S.No', 'Order ID', 'Customer', 'Order Date', 'Product', 'Quantity', 'Total'].forEach((header, i) => {
    doc.rect(xPosition, tableTop, colWidths[i], rowHeight).stroke();
    doc.text(header, xPosition, tableTop + 10, {
      width: colWidths[i],
      align: 'center'
    });
    xPosition += colWidths[i];
  });

  let yPosition = tableTop + rowHeight;
  doc.font('Helvetica').fontSize(9);

  let totalOrdersPrice = 0;

  ordersData.forEach((order, index) => {
    xPosition = tableLeft;

    colWidths.forEach(width => {
      doc.rect(xPosition, yPosition, width, rowHeight).stroke();
      xPosition += width;
    });

    xPosition = tableLeft;

    doc.text((index + 1).toString(), xPosition, yPosition + 10, { width: colWidths[0], align: 'center' });
    xPosition += colWidths[0];

    doc.text(order._id.toString().slice(-12), xPosition, yPosition + 10, { width: colWidths[1], align: 'center' });
    xPosition += colWidths[1];

    doc.text(order.address[0].name, xPosition + 5, yPosition + 5, { 
      width: colWidths[2] - 10, 
      height: rowHeight - 10, 
      align: 'left'
    });
    xPosition += colWidths[2];

    doc.text(moment(order.orderDate).format('YYYY-MM-DD'), xPosition, yPosition + 10, { width: colWidths[3], align: 'center' });
    xPosition += colWidths[3];

    let productText = order.items.map(item => item.productId.name).join(', ');
    doc.text(productText, xPosition + 5, yPosition + 5, { 
      width: colWidths[4] - 10, 
      height: rowHeight - 10, 
      align: 'left'
    });
    xPosition += colWidths[4];

    let quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    doc.text(quantity.toString(), xPosition, yPosition + 10, { width: colWidths[5], align: 'center' });
    xPosition += colWidths[5];

    doc.text(`₹${order.totalPrice.toFixed(2)}/-`, xPosition + 5, yPosition + 10, { 
      width: colWidths[6] - 15, 
      align: 'right'
    });

    totalOrdersPrice += order.totalPrice;
    yPosition += rowHeight;
  });

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total Orders Price: ₹${totalOrdersPrice.toFixed(2)}/-`, tableRight - 200, tableBottom + 10, { width: 200, align: 'right' });

  doc.end();
}

async function generateExcelReport(res, ordersData, startDate, endDate) {
  try {
    console.log('Starting Excel report generation...');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 5 },
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Order Date', key: 'orderDate', width: 15 },
      { header: 'Product', key: 'product', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Total', key: 'total', width: 15 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    let totalOrdersPrice = 0;

    // Add data rows
    ordersData.forEach((order, index) => {
      worksheet.addRow({
        sno: index + 1,
        orderId: order._id.toString().slice(-12),
        customer: order.address[0].name,
        orderDate: moment(order.orderDate).format('YYYY-MM-DD'),
        product: order.items.map(item => item.productId.name).join(', '),
        quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        total: order.totalPrice,
      });

      totalOrdersPrice += order.totalPrice;
    });

    // Add total row
    worksheet.addRow({});
    const totalRow = worksheet.addRow({
      product: 'Total Orders Price:',
      total: totalOrdersPrice,
    });
    totalRow.font = { bold: true };

    // Set number format for the 'Total' column
    worksheet.getColumn('total').numFmt = '₹#,##0.00';

    console.log('Excel worksheet created. Attempting to write to buffer...');

    // Write to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    console.log('Excel file written to buffer. Setting response headers...');

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales_report_${startDate}_to_${endDate}.xlsx`);

    console.log('Sending Excel file...');

    // Send the buffer
    res.send(buffer);

    console.log('Excel file sent successfully.');

    // For debugging: Save a copy of the file locally
    const debugPath = path.join(__dirname, `debug_report_${Date.now()}.xlsx`);
    fs.writeFileSync(debugPath, buffer);
    console.log('Debug Excel file saved:', debugPath);

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).send('Error generating Excel report');
  }
}



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
