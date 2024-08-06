const express = require("express");
const admin = express.Router();

const adminController = require("../controller/adminController");
const adminAuthentication = require("../middleware/adminAuth");
const categoryController = require("../controller/categoryController");
const productController = require("../controller/productController");
const couponController = require('../controller/couponController');
const upload = require("../middleware/addCategoryMulter");
const productUploads = require("../middleware/product-multer");

const uploadfields = [
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
  { name: "image5", maxCount: 1 },
];

admin.get(
  "/",
  adminAuthentication.existAdmin,
  adminController.adminLoginPageGet
);
admin.post(
  "/adminlogin",
  adminAuthentication.existAdmin,
  adminController.adminLoginPost
);
admin.get(
  "/dashboard",
  adminAuthentication.verifyingAdmin,
  adminController.adminDashboard
);
admin.get('/download-sales-report', adminAuthentication.verifyingAdmin, adminController.salesReport)
admin.post(
  "/adminlogout",
  adminAuthentication.verifyingAdmin,
  adminController.adminLogoutPost
);
admin.get(
  "/userlist",
  adminAuthentication.verifyingAdmin,
  adminController.userManagement
);

// route for Block & Unblock users
admin.post(
  "/blockuser/:id",
  adminAuthentication.verifyingAdmin,
  adminController.blockUser
);
admin.post(
  "/unblockuser/:id",
  adminAuthentication.verifyingAdmin,
  adminController.unblockUser
);

// route for Category
admin.get(
  "/category",
  adminAuthentication.verifyingAdmin,
  categoryController.categoryPageGet
);
admin.get(
  "/addcategory",
  adminAuthentication.verifyingAdmin,
  categoryController.addCategoryPageGet
);
admin.post(
  "/addNewCategory",
  upload.single("categoryImage"),
  categoryController.addCategoryPost
);
admin.get(
  "/editCategory/:id",
  adminAuthentication.verifyingAdmin,
  categoryController.editCategory
);
admin.post(
  "/editcategory/:id",
  upload.single("categoryImage"),
  categoryController.editCategoryPost
);
admin.post(
  "/blockcategory/:id",
  adminAuthentication.verifyingAdmin,
  categoryController.blockCategory
);
admin.post(
  "/unblockcategory/:id",
  adminAuthentication.verifyingAdmin,
  categoryController.unblockCategory
);
admin.delete(
  "/deletecategory/:id",
  adminAuthentication.verifyingAdmin,
  categoryController.deleteCategory
);

// route for product

admin.get(
  "/product-manage",
  adminAuthentication.verifyingAdmin,
  productController.productPageGet
);
admin.get(
  "/add-product",
  adminAuthentication.verifyingAdmin,
  productController.addProductPage
);
admin.post(
  "/add-product",
  productUploads.fields(uploadfields),
  productController.addProductPost
);
admin.post(
  "/blockproduct/:id",
  adminAuthentication.verifyingAdmin,
  productController.blockProduct
);
admin.post(
  "/unblockproduct/:id",
  adminAuthentication.verifyingAdmin,
  productController.unblockProduct
);
admin.get(
  "/edit-product/:id",
  adminAuthentication.verifyingAdmin,
  productController.editProductGet
);
admin.post(
  "/edit-product/:id",
  productUploads.fields(uploadfields),
  productController.editProductPost
);
admin.post(
  "/delete-product/:id",
  adminAuthentication.verifyingAdmin,
  productController.deleteProduct
);




admin.get('/order-manage',adminAuthentication.verifyingAdmin,adminController.getOrderManagement);
admin.post('/change-orderStatus/:orderId', adminAuthentication.verifyingAdmin,adminController.updateUserOrderStatus);

// route for return management

admin.get('/return-manage', adminAuthentication.verifyingAdmin, adminController.getReturnManagement)
admin.put('/change-returnStatus', adminAuthentication.verifyingAdmin, adminController.updateReaturnOrderStatus)


// ------------------------------------- routes for product offer -----------------------------------------


admin.get('/offer-product', adminAuthentication.verifyingAdmin, productController.getOfferPage);
admin.post('/create-offer', adminAuthentication.verifyingAdmin, productController.createOffer);
admin.delete('/delete-offer/:productId', adminAuthentication.verifyingAdmin, productController.deleteOffer);




// ------------------------------------- routes for category offer -----------------------------------------

admin.get('/category-offer', adminAuthentication.verifyingAdmin, categoryController.getCategoryOfferPage);
admin.post('/create-category-offer', adminAuthentication.verifyingAdmin, categoryController.createCategoryOffer);
admin.delete('/delete-category-offer/:categoryId', adminAuthentication.verifyingAdmin, categoryController.deleteCategoryOffer)



// ------------------------------------ route for coupon ---------------------------------------------------

admin.get('/managecoupon', adminAuthentication.verifyingAdmin, couponController.getCouponManagePage);
admin.post('/create-coupon', adminAuthentication.verifyingAdmin, couponController.createCoupon);
admin.put('/update-coupon', adminAuthentication.verifyingAdmin , couponController.updateCoupon);
admin.delete('/delete-coupon/:couponId', adminAuthentication.verifyingAdmin, couponController.deleteCoupon);
admin.put('/update-coupon-status', adminAuthentication.verifyingAdmin, couponController.updateCouponStatus);












module.exports = admin;
