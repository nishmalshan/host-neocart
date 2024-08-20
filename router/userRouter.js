const express = require("express");
const user = express.Router();

const userController = require("../controller/userController");
const cartController = require("../controller/cartController");
const userAuthentication = require("../middleware/userAuth");
const orderController = require("../controller/orderController");
const couponController = require('../controller/couponController');
const profileUpload = require("../middleware/profile-multer");
const passport = require('passport');
require('../middleware/passport');
user.use(passport.initialize());
user.use(passport.session())

const multer = require("multer");

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); // Create a Multer instance


// ----------------------- route for google authentication -------------------------------------

// user.get('/google', passport.authenticate('google',{ scope:
//   [ 'email', 'profile' ]
// }));

// user.get('/google/callback', 
//   passport.authenticate( 'google', {
//   successRedirect: '/auth/success',
//   failureRedirect: '/auth/failure'
// }))

user.get('/auth/success', userController.successGoogleLogin);
// user.get('/auth/failure', userController.failureGoogleLogin);


user.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

user.get('/auth/google/callback', 
  passport.authenticate('google', {
    successRedirect: '/auth/success',
    failureRedirect: '/auth/failure'
  })
);


// ----------------------------- route for signup & login -----------------------------------------

user.get("/", userController.homePageGet);
user.get("/userlogin", userController.toLoginPageGet);
user.post(
  "/logintohome",
  userAuthentication.existUser,
  userController.toLoginPost
);
user.get(
  "/usersignup",
  userAuthentication.existUser,
  userController.toSignUpPageGet
);
user.post(
  "/register",
  userAuthentication.existUser,
  userController.toSignupPost
);
user.post(
  "/userlogout",
  userAuthentication.verifyingUser,
  userController.userLogOutPost
);

// --------------------------------- routes for otp --------------------------------------

user.get("/otp", userAuthentication.existUser, userController.toGetOtpPage);
user.get(
  "/otpSending",
  userAuthentication.existUser,
  userController.otpSending
);
user.post("/otpconfirmation", userController.otpConfirmation);
user.get("/resendOtp", userController.otpSending);

// ---------------------------- route for forget password ------------------------------------
user.get(
  "/forgetPassword",
  userAuthentication.existUser,
  userController.toGetForgetPassword
);
user.post("/forgetPassword", userController.forgetPassword);
user.post("/resetPassword", userController.resetPassword);

// ------------------------------- routes for products -----------------------------------------
user.get(
  "/allproducts",
  userAuthentication.userBlockOrUnblock,
  userController.viewAllProducts
);
user.get(
  "/productdetails/:id",
  userAuthentication.userBlockOrUnblock,
  userController.productDetails
);

// -------------------------------- routes for cart ---------------------------------------------

user.post(
  "/add-to-Cart",
  userAuthentication.verifyingUser,
  cartController.postaddToCart
);
user.get(
  "/add-to-Cart",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  cartController.getaddToCart
);
user.delete(
  "/deleteCart/:productId",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  cartController.deleteCartItem
);
user.post(
  "/change-quantity",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  cartController.changeQuantity
);

// ------------------------------- route for checkout ------------------------------------------
user.get(
  "/checkout",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  cartController.checkout
);
user.post(
  "/user-Newaddress",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  userController.addNewAddress
);
user.post(
  "/user-deleteAddress/:addressId",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  userController.deleteUserAddress
);

// ------------------------------ route for order -------------------------------------------

user.post('/apply-coupon', userAuthentication.verifyingUser, orderController.applyCoupon);
user.patch('/clear-coupon', userAuthentication.verifyingUser, orderController.removeCoupon)
user.post(
  "/placeOrder",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  orderController.placeOrder
);
user.post('/verify-payment', userAuthentication.verifyingUser, orderController.verifyPayment);
user.post('/failed-payment', userAuthentication.verifyingUser, orderController.pendingPayment)
user.get(
  "/orderConfirmation",
  userAuthentication.verifyingUser,
  orderController.orderConfirmation
);

user.get('/order-List',userAuthentication.verifyingUser,orderController.orderList);
user.get('/orderDetails/:id', userAuthentication.verifyingUser, orderController.orderDetails);
user.post('/cancelOrder',userAuthentication.verifyingUser,orderController.cancelOrder);
user.patch('/returnOrder', userAuthentication.verifyingUser, orderController.returnOrder);
user.post('/download-invoice',userAuthentication.verifyingUser, orderController.generateInvoice)

// ---------------------------- route for searche products & filter products ------------------------------

user.get('/products/search',userController.searchProducts)
user.get('/filter-products',userController.filterProducts)



// ----------------------------- route for get userprofile ---------------------------------------

user.get(
  "/user-profile",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  userController.getUserProfile
);
user.put(
  "/updateUserName",
  userAuthentication.verifyingUser,
  userController.updateUserName
);
user.get(
  "/manageAddress",
  userAuthentication.verifyingUser,
  userAuthentication.userBlockOrUnblock,
  userController.manageAddress
);
user.post(
  "/user-addAddress",
  userAuthentication.verifyingUser,
  userController.addAddress
);
user.post(
  "/user-editAddress/:id",
  userAuthentication.verifyingUser,
  userController.editAddress
);
user.post(
  "/edit-profileImage",
  profileUpload.single("imageData"),
  userController.editProfileImage
);
user.patch('/change-Password', userAuthentication.verifyingUser, userController.changePassword);



// --------------------------------------------- route for wallet -----------------------------
user.get('/user-wallet', userAuthentication.verifyingUser, userController.getWallet)



// ---------------------------------- route for wishlist page ------------------------------------

user.get('/user-wishlist', userAuthentication.verifyingUser, userController.getWishlist);
user.post('/user-addToWishlist',userAuthentication.verifyingUser, userController.addWishlist);
user.delete('/user-deleteWishlist/:id', userAuthentication.verifyingUser, userController.removeFromWishlist);



// ---------------------------------- route for coupon page ----------------------------------------------

user.get('/coupons', userAuthentication.verifyingUser, couponController.getUserCouponPage);




module.exports = user;
