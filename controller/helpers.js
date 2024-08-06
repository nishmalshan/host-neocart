const {ObjectId} = require('mongodb');
const cart = require('../model/cartSchema');
const user = require('../model/user');
const offer=require('../model/productOfferSchema')
const crypto = require('crypto');

const category = require("../model/categorySchema");
const categoryOffers = require('../model/categoryofferSchema');



// function for creating random refferral code

function generateReferralCode(length = 8) {
    return crypto.randomBytes(length)
        .toString('base64')
        .replace(/\+/g, '0') // Replace '+' with '0'
        .replace(/\//g, '0') // Replace '/' with '0'
        .replace(/=+$/, '') // Remove '=' padding
        .substring(0, length); // Ensure the code is of the correct length
}




// generating random password for google authentication 

function generateRandomPassword(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }







// function for cart product details

const getProductData = async (userid) => {
    try {
        const cartData = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userid) }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.productId',
                    quantity: '$products.quantity',
                    size: '$products.size'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'cartItems'
                }
            },
            {
                $project: {
                    item: 1,
                    quantity: 1,
                    size: 1,
                    price: 1,
                    product: { $arrayElemAt: ['$cartItems', 0] }
                }
            },
            {
                $match: {
                    'product.status': true
                }
            }
        ]);

        return cartData;
    } catch (error) {
        console.error(error);
        throw error; // Throw the error to be caught by the calling function
    }
};




// function for total amount of cart product

const totalAmount = async (userid) => {
    try {
        const totalAmount = await cart.aggregate([
            {
                $match: { userId: new ObjectId(userid) }
            },
            {
                $unwind: "$products" // Unwind the products array
            },
            {
                $lookup: {
                    from: "products", // Assuming your product collection is named "products"
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product" // Unwind the product array
            },
            {
                $project: {
                    _id: 0,
                    quantity: "$products.quantity",
                    price: "$product.price",
                    discountAmount: "$product.discountAmount"
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { 
                        $sum: { 
                            $multiply: [
                                "$quantity", 
                                {
                                    $cond: {
                                        if: { $gt: ['$discountAmount', 0] },
                                        then: '$discountAmount',
                                        else: '$price'
                                    }
                                }
                            ] 
                        } 
                    }
                }
            }
        ]);
        return totalAmount.length > 0 ? totalAmount[0].totalAmount : 0;
    } catch (error) {
        console.log(error);
    }
}


$multiply: [
    '$quantity',
    {
        $cond: {
            if: { $gt: ['$product.discountAmount', 0] },
            then: '$product.discountAmount',
            else: '$product.price'
        }
    }
]



const eachProductPrice = async (userId) => {
    try {
        const eachAmount = await cart.aggregate([
            {
                $match: { userId: user }
            },
            {
                $unwind: '$products'
            },
            {
                $project: {
                    item: '$products.productId',
                    quantity: '$products.quantity',
                    size: '$products.size'
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'item',
                    foreignField: '_id',
                    as: 'cartItems'
                }
            },
            {
                $project: {
                    item: 1,
                    quantity: 1,
                    size: 1,
                    product: { $arrayElemAt: ['$cartItems', 0] }
                }
            },
            {
                $project: {
                    total: {
                        $sum: {
                            $multiply: [
                                '$quantity',
                                {
                                    $cond: {
                                        if: { $gt: ['$product.discountAmount', 0] },
                                        then: '$product.discountAmount',
                                        else: '$product.price'
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]);
        
        if (eachAmount.length > 0) {
            // const eachProductPrices = eachAmount.map(product => product.totalProductPrice);

            return eachAmount;
        } else {
            return []; // If the cart is empty or no matching user found
        }
        
    } catch (error) {
        console.log(error);
    }
};





const getCartCount = async (sessionEmail) => {
    try {
        const userData = await user.findOne({ email: sessionEmail})
        let count = 0;
        if (!userData) {

            return count;

        }else{
            const cartData = await cart.findOne({ userId: new ObjectId(userData._id)});
            if (cartData) {
                count = cartData.products.length;
                return count;
            }
        }
        
    }catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}







// async function findOfferCategory() {
//     const categoryOffer = await categoryOffers.find();
//     const categories = await category.find(); // Fetch all categories

//     const offerCategory = categories.find(cat =>
//         categoryOffer.some(offer => offer.categoryId.equals(cat._id))
//     );

//     console.log('offerCategory', offerCategory);
//     return offerCategory;
// }












module.exports = {
    getProductData,
    totalAmount,
    eachProductPrice,
    getCartCount,
    generateReferralCode,
    generateRandomPassword,
    // findOfferCategory
}