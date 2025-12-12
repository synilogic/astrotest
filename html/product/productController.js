
import { Op } from 'sequelize';
import path from 'path';
import fs from 'fs';
import Product from '../_models/productModel.js';
import ProductCategory from '../_models/productCategoryModel.js';
import ProductGallery from '../_models/productGalleryModel.js';


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

    return res.status(200).json({
      status: 1,
      data,
      msg: 'Category List',
    });
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

    const where = {
      status: '1',
      price: { [Op.gt]: 0 },
    };

    if (search) {
      where.product_name = { [Op.like]: `%${search}%` };
    }
    if (category_id) {
      where.product_category_id = category_id;
    }

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

    return res.status(200).json({
      status: 1,
      offset,
      data,
      msg: 'Product List',
    });
  } catch (error) {
    console.error('Error in /products:', error);
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: error.message,
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