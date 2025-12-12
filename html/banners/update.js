import express from 'express';
import dotenv from 'dotenv';
import db from "../_config/db.js";
import "../_models/index.js";
import Banner from '../_models/banners.js';
import BannerCategory from '../_models/banner_categories.js'; // Import your BannerCategory model
dotenv.config();
const router = express.Router();

// Update Banner API
router.put('/update/:id', async (req, res) => {
    console.log("mahesh sss");
  try {
    const bannerId = req.params.id; // Get banner ID from URL
    const { banner_category_id, title, subject, banner_image, url, status } = req.body;
         
    // Validate if the category exists
    const category = await BannerCategory.findByPk(banner_category_id);
    console.log("here category",category); 
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Find the banner to update
    const banner = await Banner.findByPk(bannerId);
    console.log("banner here",banner);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    // Update the banner
    banner.banner_category_id = banner_category_id;
    banner.title = title;
    banner.subject = subject;
    banner.banner_image = banner_image;
    banner.url = url;
    banner.status = status;

    // Save the updated banner
    await banner.save();

    // Fetch the updated banner with its associated category
    const updatedBanner = await Banner.findByPk(banner.id, {
      include: [
        {
          model: BannerCategory,
          as: 'category',
          attributes: ['id', 'title'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner,
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
// Delete Banner API
router.delete('/delete/:id', async (req, res) => {
  try {
    const bannerId = req.params.id; // Get banner ID from URL

    // Find the banner to delete
    const banner = await Banner.findByPk(bannerId);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    // Delete the banner
    await banner.destroy();

    return res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});
export default router;
