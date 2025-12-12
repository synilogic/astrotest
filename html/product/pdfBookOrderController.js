import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import { PdfBookOrder } from '../_models/pdfBookOrderModel.js';
import { PdfBook } from '../_models/pdfBookModel.js';
import { PdfBookCategory } from '../_models/pdfBookCategoryModel.js';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

const {
  api_page_limit_secondary,
  pdf_image_path,
  sample_pdf_path,
  main_pdf_path,
  PDF_BOOK_CATEGORY_IMAGE_PATH,
  default_pdf_image_path,
  default_image_path
} = constants;

export const pdfBookPurchaseList = async (req, res) => {
  try {
    const { api_key = '', user_uni_id = '', offset = 0 } = req.body;

    if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
      return res.json({
        status: 0,
        error_code: 101,
        msg: 'Unauthorized User... Please login again',
      });
    }

    const page_limit = api_page_limit_secondary || 15;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const orders = await PdfBookOrder.findAll({
      where: {
        user_uni_id,
        status: 1,
      },
      offset: parseInt(offset),
      limit: parseInt(page_limit),
      include: [
        {
          model: PdfBook,
          as: 'pdf_book',
          attributes: ['title', 'description', 'pdf_image', 'sample_pdf', 'main_pdf'],
          include: [
            {
              model: PdfBookCategory,
              as: 'pdf_book_category',
              attributes: ['id', 'title', ['image', 'pdf_book_category_image']],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    const pdfImagePath = path.join(process.cwd(), 'public', pdf_image_path);
    const samplePath = path.join(process.cwd(), 'public', sample_pdf_path);
    const mainPath = path.join(process.cwd(), 'public', main_pdf_path);
    const catImagePath = path.join(process.cwd(), 'public', PDF_BOOK_CATEGORY_IMAGE_PATH);

    const data = orders.map((item) => {
      const book = item.pdf_book || {};
      const category = book.pdf_book_category || {};

      return {
        id: item.id,
        pdf_book_id: item.pdf_book_id,
        user_uni_id: item.user_uni_id,
        order_id: item.order_id,
        subtotal: item.subtotal,
        reference_id: item.reference_id,
        reference_percent: item.reference_percent,
        reference_amount: item.reference_amount,
        offer_percent: item.offer_percent,
        offer_amount: item.offer_amount,
        total_amount: item.total_amount,
        status: item.status,
        created_at: moment(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment(item.updated_at).format("YYYY-MM-DD HH:mm:ss"),
        title: book.title || '',
        description: book.description || '',
        pdf_image: fileUrlOrDefault(pdfImagePath, book.pdf_image, pdf_image_path, default_pdf_image_path, baseUrl),
        sample_pdf: fileUrlOrDefault(samplePath, book.sample_pdf, sample_pdf_path, '', baseUrl),
        main_pdf: fileUrlOrDefault(mainPath, book.main_pdf, main_pdf_path, '', baseUrl),
        pdf_book_category_title: category.title || '',
        pdf_book_category_image: fileUrlOrDefault(catImagePath, category.pdf_book_category_image, PDF_BOOK_CATEGORY_IMAGE_PATH, default_image_path, baseUrl),
      };
    });

    return res.json(
      data.length > 0
        ? {
            status: 1,
            offset: parseInt(offset) + page_limit,
            data,
            msg: 'Get successfully',
          }
        : {
            status: 0,
            data: '',
            msg: 'No data found',
          }
    );
  } catch (err) {
    console.error('pdfBookPurchaseList error:', err);
    return res.status(500).json({
      status: 0,
      msg: 'Internal server error',
    });
  }
};

const fileUrlOrDefault = (folderPath, fileName, publicPath, fallback, baseUrl) => {
  if (fileName && fs.existsSync(path.join(folderPath, fileName))) {
    return `${baseUrl}/${publicPath}${fileName}`;
  }
  return fallback ? `${baseUrl}/${fallback}` : '';
};
