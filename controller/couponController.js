const user = require("../model/user");
const coupons = require('../model/couponSchema');
const helpers = require('../controller/helpers');



// get method for coupon page

const getUserCouponPage = async (req, res) => {
    try {
      const User = await user.findOne({ email: req.session.email });
  
      if (!User) {
        return res.json({ userlogged: false, message: 'User not found' });
      }
  
      const cartCount = await helpers.getCartCount(req.session.email);
      const date = Date.now()
      const couponData = await coupons.find({ status: true, expiryDate: { $gt: date }});
  
      res.render('./user/coupon', { title: 'coupons', cartCount, User, couponData })
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }








// --------------------------------------  Admin side coupon functions  -----------------------------------------


// get method for coupon manage page

const getCouponManagePage = async (req, res) => {
    try {
        const couponData = await coupons.find();
        res.render('./admin/couponManage', { title: 'coupon-manage', couponData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}


// post method for create coupon 

const createCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, minPurchaseAmount, maxPurchaseAmount, discountAmount, startDate, endDate } = req.body;
            
            const existCouponCode = await coupons.findOne({ couponCode: couponCode });
            if (existCouponCode) {
                 return res.json({ success: false, message: 'Coupon already exist' });
            } else {

                const newCoupon = new coupons({
                    couponName: couponName,
                    couponCode: couponCode,
                    minPurchaseAmount: minPurchaseAmount,
                    maxPurchaseAmount: maxPurchaseAmount,
                    discountAmount: discountAmount,
                    startDate: startDate,
                    expiryDate: endDate
                })
                await newCoupon.save();
                res.json({ success: true, message: 'Coupon Created Successfully' });
            }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}




// put method for update coupon 

const updateCoupon = async (req, res) => {
    try {
        const { couponName, couponId, couponCode, minPurchaseAmount, maxPurchaseAmount, discountAmount, startDate, expiryDate } = req.body;

        const existCoupon = await coupons.findOne({ _id: couponId});
        if (existCoupon) {
            existCoupon.couponName = couponName
            existCoupon.couponCode = couponCode
            existCoupon.minPurchaseAmount = minPurchaseAmount
            existCoupon.maxPurchaseAmount = maxPurchaseAmount
            existCoupon.discountAmount = discountAmount
            existCoupon.startDate = startDate
            existCoupon.expiryDate = expiryDate

            await existCoupon.save();
            res.json({ success: true, message: 'Coupon Updated Successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}




// delete method for remove coupon

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId

        await coupons.findByIdAndDelete(couponId);

        res.json({ success: true, message: 'Coupon Ddeleted Successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}



// function for automatically delete expiry coupon

const deleteExpiredCoupons = async () => {
    try {
        const currentDate = new Date();

        // Delete coupons where expiryDate is less than the current date
        const result = await coupons.deleteMany({ expiryDate: { $lt: currentDate } });

        if (result.deletedCount > 0) {
            console.log(`Deleted ${result.deletedCount} expired coupons.`);
        } else {
            console.log('No expired coupons found.');
        }
    } catch (error) {
        console.error('Error deleting expired coupons:', error);
    }
};




// put method for update coupon status 

const updateCouponStatus = async (req, res) => {
    try {
        const { couponId, status } = req.body;

        // Update the coupon status
        await coupons.findByIdAndUpdate(couponId, { status: status });

        res.json({ success: true, message: 'Coupon status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating coupon status' });
    }
};











  


  module.exports = {
    getUserCouponPage,
    getCouponManagePage,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    updateCouponStatus
  }