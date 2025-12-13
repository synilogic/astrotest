
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import Joi from 'joi';
import Product from '../_models/productModel.js';
import ProductCategory from '../_models/productCategoryModel.js';
import ProductGallery from '../_models/productGalleryModel.js';
import { getFromCache, setToCache, CACHE_TTL } from '../_helpers/cacheHelper.js';
import { checkUserApiKey } from '../_helpers/common.js';


// Helper to build image URLs
const getImageUrl = (baseUrl, imagePath, imageFile, fallbackFile) => {
  const fullPath = path.join(imagePath, imageFile || '');
  if (imageFile && fs.existsSync(fullPath)) {
    return `${baseUrl}/${imageFile}`;
  } else {
    return `${baseUrl}/${fallbackFile}`;
  }
};






// Product Category Controller
export const productCategory = async (req, res) => {
  try {
    const { search, offset = 0, limit = 10, status } = req.body || {};

    // Check cache first (only for non-search queries)
    const cacheKey = {
      offset: Number(offset),
      limit: Number(limit),
      status: status !== undefined && status !== '' ? Number(status) : 1,
      search: search || ''
    };
    
    // Only cache if no search
    if (!search) {
      const cachedResult = await getFromCache('productCategories', cacheKey);
      if (cachedResult) {
        // Update image URLs with current host
        const records = cachedResult.data || [];
        for (const category of records) {
          category.image = category.image
            ? category.image.replace(/https?:\/\/[^/]+/, `${req.protocol}://${req.get("host")}`)
            : `${req.protocol}://${req.get("host")}/uploads/product_category/default.jpg`;
        }
        return res.status(200).json(cachedResult);
      }
    }

    const where = {};
    if (status !== undefined && status !== '') {
      where.status = status;
    } else {
      where.status = 1;
    }

    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const categories = await ProductCategory.findAll({
      where,
      order: [['title', 'ASC']],
      offset: Number(offset),
      limit: Number(limit),
    });

    const baseUrl = process.env.IMAGE_BASE_URL_CATEGORY || 'http://localhost:8007/uploads/product_category';
    const imagePath = path.resolve('public/uploads/product_category/');

    const fallbackImage = 'default.jpg';

    const data = categories.map(cat => ({
      ...cat.toJSON(),
      image: cat.image 
        ? `${req.protocol}://${req.get("host")}/uploads/product_category/${cat.image}`
        : `${req.protocol}://${req.get("host")}/uploads/product_category/${fallbackImage}`,
    }));

    const result = {
      status: 1,
      data,
      msg: 'Category List',
    };

    // Cache the result (only if no search)
    if (!search) {
      await setToCache('productCategories', cacheKey, result, CACHE_TTL.MEDIUM);
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Error in /productCategory:', err);
    return res.status(500).json({
      status: 0,
      error: err.message,
      msg: 'Something went wrong',
    });
  }
};




// Updated Products Controller
// export const products = async (req, res) => {
//   try {
//     let { offset = 0, limit = 10, search = '', category_id } = req.body;

//     offset = Number(offset);
//     limit = Number(limit);

//     const where = {
//       status: '1',
//       price: { [Op.gt]: 0 },
//     };

//     if (search) {
//       where.product_name = { [Op.like]: `%${search}%` };
//     }
//     if (category_id) {
//       where.product_category_id = category_id;
//     } 

//     // Fetch products with category and galleries
//     const productsList = await Product.findAll({
//       where,
//       include: [
//          {
//           model: ProductGallery,
//           as: 'productGallery',
//         },
//         {
//           model: ProductCategory,
//           as: 'productcategory',
//         },
       
//       ],
//       offset,
//       limit,
//       order: [['id', 'DESC']],
//     });

//     const data = productsList.map(product => {
//   const prodJSON = product.toJSON();

//   //  const baseUrlProduct = process.env.IMAGE_BASE_URL_PRODUCT || 'http://localhost:8007/images/product';
//   //   const imagePath = path.resolve('assets/img/product.png');
//     const fallbackImage = 'product.png';

//   const gallery_image_list = prodJSON.productGallery.map(g => 
//     g.image 
//       ? `${req.protocol}://${req.get("host")}/assets/img/${g.image}` 
//       : `${req.protocol}://${req.get("host")}/assets/img/${fallbackImage}`
//   );

//   const main_image = prodJSON.product_image 
//     ? `${req.protocol}://${req.get("host")}/assets/img/${prodJSON.product_image}` 
//     : `${req.protocol}://${req.get("host")}assets/img/${fallbackImage}`;

//   delete prodJSON.productGallery;

//   return {
//     ...prodJSON,
//     product_image: main_image,
//     gallery_image_list,
//   };
// });


//     return res.status(200).json({
//       status: 1,
//       offset,
//       data,
//       msg: 'Product List',
//     });
//   } catch (error) {
//     console.error('Error in /products:', error);
//     return res.status(500).json({
//       status: 0,
//       msg: 'Something went wrong',
//       error: error.message,
//     });
//   }
// };


export const products = async (req, res) => {
  try {
    let { offset = 0, limit = 10, search = '', category_id } = req.body;

    offset = Number(offset);
    limit = Number(limit);

    console.log('[Product Controller] Request received:', {
      offset,
      limit,
      search,
      category_id,
      category_id_type: typeof category_id
    });

    // Check cache first (only for non-search queries)
    const cacheKey = {
      offset: Number(offset),
      limit: Number(limit),
      category_id: category_id ? Number(category_id) : null,
      search: search || ''
    };
    
    // Only cache if no search
    if (!search) {
      const cachedResult = await getFromCache('products', cacheKey);
      if (cachedResult) {
        return res.status(200).json(cachedResult);
      }
    }

    // Check if we should filter by price > 0
    // Some products might have price = 0 or null, so we'll be more lenient
    const where = {
      status: '1',
      // Only filter by price > 0 if we want to exclude free products
      // For now, allow products with any price (including 0)
      // price: { [Op.gt]: 0 },
    };

    if (search) {
      where.product_name = { [Op.like]: `%${search}%` };
    }
    if (category_id) {
      // Convert category_id to number if it's a string
      const categoryIdNum = typeof category_id === 'string' ? parseInt(category_id, 10) : category_id;
      if (!isNaN(categoryIdNum)) {
        where.product_category_id = categoryIdNum;
        console.log('[Product Controller] Filtering by category_id:', categoryIdNum);
        
        // Debug: Check category exists
        const categoryExists = await ProductCategory.findOne({ 
          where: { id: categoryIdNum, status: '1' } 
        });
        if (categoryExists) {
          console.log('[Product Controller] Category found:', {
            id: categoryExists.id,
            title: categoryExists.title,
            status: categoryExists.status
          });
        } else {
          console.warn('[Product Controller] Category NOT found or inactive:', categoryIdNum);
        }
      } else {
        console.warn('[Product Controller] Invalid category_id (not a number):', category_id);
      }
    }

    console.log('[Product Controller] Where clause:', JSON.stringify(where, null, 2));

    const productsList = await Product.findAll({
      where,
      include: [
        {
          model: ProductGallery,
          as: 'productGallery',
        },
        {
          model: ProductCategory,
          as: 'productcategory',
        },
      ],
      offset,
      limit,
      order: [['id', 'DESC']],
    });

    console.log('[Product Controller] Products found:', productsList.length);
    if (productsList.length > 0) {
      console.log('[Product Controller] Sample product:', {
        id: productsList[0].id,
        product_name: productsList[0].product_name,
        product_category_id: productsList[0].product_category_id,
        price: productsList[0].price,
        status: productsList[0].status,
        category_name: productsList[0].productcategory?.title
      });
    } else {
      console.log('[Product Controller] No products found with filters:', where);
      
      // Debug: Check if products exist without filters
      const totalProducts = await Product.count({ where: { status: '1' } });
      console.log('[Product Controller] Total active products in database:', totalProducts);
      
      if (category_id) {
        const categoryIdNum = typeof category_id === 'string' ? parseInt(category_id, 10) : category_id;
        const productsInCategory = await Product.count({ 
          where: { 
            status: '1',
            product_category_id: categoryIdNum 
          } 
        });
        console.log('[Product Controller] Products in category', categoryIdNum, ':', productsInCategory);
      }
    }

    const defaultImagePath = 'assets/img/product.png'; // Match PHP config

    const data = productsList.map(product => {
      const prodJSON = product.toJSON();

      const gallery_image_list = prodJSON.productGallery.map(g =>
        g.image
          ? `${req.protocol}://${req.get("host")}/uploads/product/product_gellery/${g.image}`
          : `${req.protocol}://${req.get("host")}/${defaultImagePath}`
      );

      const main_image = prodJSON.product_image
        ? `${req.protocol}://${req.get("host")}/uploads/product/${prodJSON.product_image}`
        : `${req.protocol}://${req.get("host")}/${defaultImagePath}`;

      delete prodJSON.productGallery;

      return {
        ...prodJSON,
        product_image: main_image,
        gallery_image_list,
      };
    });

    const result = {
      status: 1,
      offset,
      data,
      msg: 'Product List',
    };

    // Cache the result (only if no search)
    if (!search) {
      await setToCache('products', cacheKey, result, CACHE_TTL.MEDIUM);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /products:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: error.message,
    });
  }
};



// Add Product Controller
export const addProduct = async (req, res) => {
  try {
    const schema = Joi.object({
      api_key: Joi.string().required(),
      user_uni_id: Joi.string().required(),
      product_category_id: Joi.number().integer().required(),
      product_name: Joi.string().required(),
      price: Joi.number().required(),
      mrp: Joi.number().optional().allow(null, ''),
      hsn: Joi.string().optional().allow(null, ''),
      gst_percentage: Joi.string().optional().allow(null, ''),
      quantity: Joi.number().integer().optional().default(0),
      product_description: Joi.string().optional().allow(null, ''),
      product_image: Joi.string().optional().allow(null, '')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 0,
        errors: error.details,
        msg: error.details.map(e => e.message).join('\n')
      });
    }

    const { api_key, user_uni_id, product_category_id, product_name, price, mrp, hsn, gst_percentage, quantity, product_description, product_image } = value;

    // Check API key
    const isAuthorized = await checkUserApiKey(api_key, user_uni_id);
    if (!isAuthorized) {
      return res.status(401).json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again'
      });
    }

    // Verify vendor
    const User = (await import('../_models/users.js')).default;
    const vendorUser = await User.findOne({
      where: {
        user_uni_id: user_uni_id,
        role_id: 5, // Vendor role
        trash: 0
      }
    });

    if (!vendorUser) {
      return res.status(403).json({
        status: 0,
        msg: 'Only vendors can add products'
      });
    }

    // Create product
    const newProduct = await Product.create({
      vendor_uni_id: user_uni_id,
      product_category_id,
      product_name,
      price: parseFloat(price),
      mrp: mrp ? parseFloat(mrp) : parseFloat(price),
      hsn: hsn || '',
      gst_percentage: gst_percentage || '0',
      quantity: quantity || 0,
      product_description: product_description || '',
      product_image: product_image || '',
      status: '1',
      created_at: new Date(),
      updated_at: new Date()
    });

    return res.status(200).json({
      status: 1,
      data: newProduct,
      msg: 'Product added successfully'
    });
  } catch (error) {
    console.error('Error in addProduct:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: error.message
    });
  }
};

// Product Detail Controller
export const productDetail = async (req, res) => {
  try {
    const { product_id, slug } = req.body;

    if (!product_id && !slug) {
      return res.status(400).json({
        status: 0,
        msg: 'Please provide product_id or slug',
      });
    }

    const where = { status: '1' };
    if (product_id) where.id = product_id;
    else if (slug) where.slug = slug;

    // Fetch product with category and gallery associations
    const product = await Product.findOne({
      where,
      include: [
        {
          model: ProductGallery,
          as: 'productGallery',
        },
        {
          model: ProductCategory,
          as: 'productcategory',
        },
        
      ],
    });

    if (!product) {
      return res.status(200).json({
        status: 0,
        msg: 'No Record Found',
      });
    }

    // const baseUrlProduct = process.env.IMAGE_BASE_URL_PRODUCT || 'http://localhost:8007/images/product';
    // const imagePath = path.resolve('public/images/product/');
    // const fallbackImage = 'default.jpg';

    const gallery_image_list = product.productGallery.map((img) => {
  return img.image 
    ? `${req.protocol}://${req.get("host")}/images/product/${img.image}` 
    : `${req.protocol}://${req.get("host")}/images/product/${fallbackImage}`;
});

const productImageUrl = product.product_image 
  ? `${req.protocol}://${req.get("host")}/images/product/${product.product_image}` 
  : `${req.protocol}://${req.get("host")}/images/product/${fallbackImage}`;

    // Prepare response data object
    const responseData = {
      ...product.toJSON(),
      product_image: productImageUrl,
      gallery_image_list,
    };

    // Remove productGallery from response (optional)
    delete responseData.productGallery;

    return res.status(200).json({
      status: 1,
      data: responseData,
      msg: 'Product List',
    });
  } catch (err) {
    console.error('Error in /productDetail:', err);
    return res.status(500).json({
      status: 0,
      error: err.message,
      msg: 'Something went wrong',
    });
  }
};