const category = require("../model/categorySchema");
const categoryOffer = require("../model/categoryofferSchema");
const mongoose = require('mongoose');
const cron = require('node-cron');



// get method for category page

const categoryPageGet = async (req, res) => {
  try {
    let i=0;
    const categoryData = await category.find().sort({ name: 1});
    res.render("./admin/categorymanage", { categoryData, i, title: 'categoryManagement' });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



// get method for Add category page

const addCategoryPageGet = (req, res) => {
  try {
    const message = req.flash('success')
    res.render("./admin/addcategory", { message, title: "addcategory", error: req.flash('error') });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




// post method for Add category

const addCategoryPost = async (req, res) => {
    try {

        const { categoryName } = req.body;
        const image = req.file ? req.file.filename : null;

    const existCategory = await category.findOne({ name: categoryName.toLowerCase() });
    

    
        if (existCategory) {
            req.flash("error", "Category with the same name already exists");
            return res.redirect("/admin/addcategory");
        } else {
            if (image !== null) {
                const newCategory = await category.create({
                    name: categoryName.toLowerCase(),
                    image: image,
                });
                
                res.redirect("/admin/category?success=Category added successfully");
            } else {
                // req.flash("error", "Image is required for the category");
                res.redirect("/addcategory");
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
    
};




// get method for admin edit category

const editCategory = async (req,res) => {
  try {

    const id = req.params.id;

    const categoryData = await category.findOne({ _id: id })

    res.render('./admin/editcategory',{categoryData, title: 'editCategory', error: req.flash('error')})
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}



// post method for admin edit category

const editCategoryPost = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName } = req.body; // Correctly destructuring categoryName from req.body

    const newImage = req.file ? req.file.filename : undefined;

    const existCategory = await category.findOne({ name: categoryName.toLowerCase() });

    if (existCategory) {
      
      req.flash("error", "Category with the same name already exists");
      return res.redirect(`/admin/editCategory/${id}`);
    } else {
      
      const updatedCategory = await category.findByIdAndUpdate(id, {
        $set: {
          name: categoryName.toLowerCase(),
          image: newImage,
        },
      });

      if (updatedCategory) {
        res.redirect('/admin/category');
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




// post method for block category

const blockCategory = async (req,res) => {
  
  try {
    
    const id = req.params.id;

    const block = await category.updateOne({ _id:id }, {$set: { status: false }});

    res.redirect("/admin/category?message=Category successfully blocked")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}





// post method for unblock category


const unblockCategory = async (req,res) => {
  
  try {
    
    const id = req.params.id;

    const unblock = await category.updateOne({ _id:id }, {$set: { status: true }});

    res.redirect("/admin/category?message=Category successfully unblocked")

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
}



// post method for delete category 

const deleteCategory = async (req,res) => {

  try {
    
    const id = req.params.id;

    const deleteCategory = await category.deleteOne({ _id: id });

    // res.redirect('/admin/category?message=Category successfully deleted');
    res.json({ success: true, message: 'Item deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}



// get method for get category offer page

const getCategoryOfferPage = async (req, res) => {
  try {
    const categoryData = await category.find().sort({ name: 1 });
    const categoryOfferData = await categoryOffer.find()
    res.render('./admin/categoryofferManage', { title: 'category-offer', categoryData, categoryOfferData})
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}




// post method for create category offer

const createCategoryOffer = async (req, res) => {
  try {
    const { categoryId, discount, startDate, endDate } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).render('user/404');
    }

    const existCategoryOffer = await categoryOffer.findOne({ categoryId: categoryId });
    if (existCategoryOffer) {
      existCategoryOffer.percentage = discount;
      existCategoryOffer.startDate = startDate;
      existCategoryOffer.expiryDate = endDate;
      await existCategoryOffer.save();
      console.log('Category offer updated successfully');
      return res.json({ success: true, message: 'Category Offer Updated Successfully' });
    } else {
      const categoryData = await category.findById(categoryId);
      if (!categoryData) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const newCategoryOffer = new categoryOffer({
        categoryId,
        categoryName: categoryData.name,
        percentage: discount,
        startDate: startDate,
        expiryDate: endDate
      })
      await newCategoryOffer.save()

      res.json({ success: true, message: 'Category Offer Created Successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}





// delete method for delete category offer 
const deleteCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const deletedCategoryOffer = await categoryOffer.deleteOne({ categoryId: categoryId });
    if (deletedCategoryOffer) {
        
        res.json({ success: true, message: 'Offer deleted successfully' });

    } else {
      console.log('Offer not found');
      res.json({ success: false, message: 'Offer not found' });
    }
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



// funcion for automatically delete category offer
const deleteExpiredCategoryOffers = async () => {
  try {
      const currentDate = new Date();
      const result = await categoryOffer.deleteMany({ expiryDate: { $lt: currentDate } });

      if (result.deletedCount > 0) {
          console.log(`Deleted ${result.deletedCount} expired category offers.`);
      } else {
          console.log('No expired category offers found.');
      }
  } catch (error) {
      console.error('Error deleting expired category offers:', error);
  }
};

// Schedule the job to run at midnight every day
cron.schedule('0 0 * * *', deleteExpiredCategoryOffers, {
  scheduled: true,
  timezone: "Asia/Kolkata"
});



















module.exports = {
  categoryPageGet,
  addCategoryPageGet,
  addCategoryPost,
  editCategory,
  editCategoryPost,
  blockCategory,
  unblockCategory,
  deleteCategory,
  getCategoryOfferPage,
  createCategoryOffer,
  deleteCategoryOffer
};
