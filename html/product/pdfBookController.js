
import { Op } from 'sequelize';
import { PdfBookCategory } from '../_models/pdfBookCategoryModel.js';
import { PdfBook } from '../_models/pdfBookModel.js';
import { PdfBookOrder } from '../_models/pdfBookOrderModel.js';
import { checkUserApiKey } from '../_helpers/common.js';
import { constants } from '../_config/constants.js';
import moment from 'moment';

const {
  api_page_limit_secondary,
  PDF_BOOK_CATEGORY_IMAGE_PATH,
  DEFAULT_IMAGE_PATH,
  PDF_BOOK_IMAGE_PATH,
  sample_pdf_path,
  main_pdf_path,
  default_pdf_image_path,
  image_base_url
} = constants;


export const pdfBookCategory = async (req, res) => {
  const { search = '', offset = 0 } = req.body;

  try {
    const whereClause = { status: '1' };

    if (search.trim()) {
      whereClause.title = { [Op.like]: `%${search.trim()}%` };
    }

    let categories = await PdfBookCategory.findAll({
      where: whereClause,
      order: [['title', 'ASC']],
      offset: parseInt(offset),
      limit: constants.api_page_limit_secondary,
    });

    // ✅ Dynamic base URL (uses current domain/IP from request)
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    categories = categories.map(cat => ({
      ...cat.toJSON(),
      image: cat.image
        ? `${baseUrl}/${constants.PDF_BOOK_CATEGORY_IMAGE_PATH}${cat.image}`
        : `${baseUrl}/${constants.default_image_path}`,
      created_at: moment(cat.created_at).format("YYYY-MM-DD HH:mm:ss"),
      updated_at: moment(cat.updated_at).format("YYYY-MM-DD HH:mm:ss"),
    }));

    return res.json({
      status: 1,
      data: categories,
      msg: 'Pdf Book Category list',
    });

  } catch (error) {
    return res.status(500).json({
      status: 0,
      errors: error.message,
      msg: 'Something went wrong',
    });
  }
};


export const pdfBookList = async (req, res) => {
  const {
    api_key = '',
    user_uni_id = '',
    search = '',
    offset = 0,
    pdf_book_category_id = null
  } = req.body;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const page_limit = api_page_limit_secondary;

  if ((api_key || user_uni_id) && !(await checkUserApiKey(api_key, user_uni_id))) {
    return res.status(401).json({
      status: 0,
      error_code: 101,
      msg: 'Unauthorized User... Please login again',
    });
  }

  try {
    const whereClause = { status: '1' };

    if (search.trim()) {
      whereClause.title = { [Op.like]: `%${search.trim()}%` };
    }

    if (pdf_book_category_id) {
      whereClause.pdf_book_category_id = pdf_book_category_id;
    }

    const books = await PdfBook.findAll({
      where: whereClause,
      order: [['title', 'ASC']],
      offset: parseInt(offset),
      limit: page_limit,
    });

    const finalBooks = await Promise.all(
      books.map(async (book) => {
        let payment_status = 0;

        const order = await PdfBookOrder.findOne({
          where: {
            pdf_book_id: book.id,
            user_uni_id,
            status: '1',
          },
        });

        if (!order) {
          book.main_pdf = '';
        } else {
          payment_status = 1;
        }

        const bookJson = book.toJSON();

        return {
          ...bookJson,
          pdf_image: bookJson.pdf_image
            ? `${baseUrl}/${PDF_BOOK_IMAGE_PATH}${bookJson.pdf_image}`
            : `${baseUrl}/${DEFAULT_IMAGE_PATH}`,
          sample_pdf: bookJson.sample_pdf
            ? `${baseUrl}/${sample_pdf_path}${bookJson.sample_pdf}`
            : '',
          main_pdf: bookJson.main_pdf
            ? `${baseUrl}/${main_pdf_path}${bookJson.main_pdf}`
            : '',
          created_at: moment(bookJson.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updated_at: moment(bookJson.updated_at).format('YYYY-MM-DD HH:mm:ss'),
          payment_status,
        };
      })
    );

    return res.json(
      finalBooks.length > 0
        ? {
            status: 1,
            offset: parseInt(offset) + page_limit,
            data: finalBooks,
            msg: 'Get successfully',
          }
        : {
            status: 0,
            msg: 'No data found',
          }
    );
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: 'Something went wrong',
      error: error.message,
    });
  }
};

export const pdfBookOrderList = async (req, res) => {
  const { user_uni_id, offset = 0 } = req.body;
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  if (!user_uni_id) {
    return res.status(400).json({
      status: 0,
      msg: 'user_uni_id is required',
    });
  }

  try {
    const orders = await PdfBookOrder.findAll({
      where: { user_uni_id },
      include: [
        {
          model: PdfBook,
          as: 'pdf_book',
          attributes: ['title', 'pdf_image'],
        },
      ],
      order: [['id', 'DESC']],
      offset: parseInt(offset),
      limit: api_page_limit_secondary,
    });

    const formatted = orders.map(order => ({
      ...order.toJSON(),
      pdf_book: {
        ...order.pdf_book,
        pdf_image: order.pdf_book?.pdf_image
          ? `${baseUrl}/${PDF_BOOK_IMAGE_PATH}${order.pdf_book.pdf_image}`
          : `${baseUrl}/${DEFAULT_IMAGE_PATH}`,
      },
    }));

    return res.json({
      status: 1,
      data: formatted,
      msg: 'Pdf Book Order list',
    });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      msg: error.message,
    });
  }
};
