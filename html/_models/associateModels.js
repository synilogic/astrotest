
import UserModel from "./users.js";
import CustomerModel from "./customers.js";
import Banner from "./banners.js";
import BannerCategory from "./banner_categories.js";
import Astrologer from "./astrologers.js";
import ApiKey from "./apikeys.js"; // Ensure this model exists and is imported
import CallHistory from "./callHistoryModel.js";
import ChatChannel from "./chatChannelModel.js";
import ChatChannelHistory from "./chatChannelHistoryModel.js";
import RoleModel from './roles.js';
import WalletModel from './wallet.js';
import WithdrawalRequestModel from './WithdrawalRequest.js';
import FollowersModel from './followers.js';

import Reviews from './reviews.js'
import User from './users.js';
import Customer from './customers.js'
import { Sanjeevini } from './Sanjeevini.js';
import { SanjeeviniOrder } from './SanjeeviniOrder.js';
import  SwitchWord  from './switchword.js';
import { SwitchWordOrder } from './switchwordOrder.js'

import { PdfBook } from './pdfBookModel.js';
import { PdfBookOrder } from './pdfBookOrderModel.js';
import { PdfBookCategory } from './pdfBookCategoryModel.js';
import { PaidKundliManualOrder } from './paidKundliManualOrderModel.js';
import { PaidKundliManual } from './paidKundliManualModel.js';


import ServiceOrder from './serviceOrder.js';
import { Service } from './service.js';
import { ServiceAssign } from './serviceAssign.js';
import  ServiceCategory  from './serviceCategory.js';

import Blog from '../_models/blog.js';
import BlogCategory from '../_models/blogCategory.js';

Blog.belongsTo(Astrologer, {
  foreignKey: 'auth_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer_short'
});

Blog.belongsTo(User, {
  foreignKey: 'auth_id',
  targetKey: 'user_uni_id',
  as: 'user_short'
});

Blog.belongsTo(BlogCategory, {
  foreignKey: 'blog_category_id',
  as: 'blogcategory_short' // Use only this once
});

Service.belongsTo(ServiceCategory, {
  foreignKey: 'service_category_id',
  as: 'category',
});

ServiceAssign.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service_assign'
});

ServiceOrder.belongsTo(ServiceAssign, {
  foreignKey: 'service_assign_id',
  as: 'service_assign'
});

ServiceAssign.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'services'
});

ServiceOrder.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});

ServiceOrder.belongsTo(User, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'user_uni_id',
  as: 'user_astrologer'
});

ChatChannelHistory.belongsTo(UserModel, {
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id', 
  as: 'chat_user'
});

ChatChannelHistory.belongsTo(Astrologer, {
  foreignKey: 'user_uni_id', 
  targetKey: 'astrologer_uni_id', 
  as: 'chat_astrologer'
});

ChatChannelHistory.belongsTo(CustomerModel, {
  foreignKey: 'user_uni_id', 
  targetKey: 'customer_uni_id', 
  as: 'chat_customer'
});


PaidKundliManualOrder.belongsTo(PaidKundliManual, {
  foreignKey: 'paid_kundli_manual_id',
  as: 'manual',
});

PaidKundliManual.hasMany(PaidKundliManualOrder, {
  foreignKey: 'paid_kundli_manual_id',
  as: 'orders'
});



// PdfBookOrder -> PdfBook
PdfBookOrder.belongsTo(PdfBook, {
  foreignKey: 'pdf_book_id',
  as: 'pdf_book',
});

// PdfBook -> PdfBookCategory
PdfBook.belongsTo(PdfBookCategory, {
  foreignKey: 'pdf_book_category_id',
  as: 'pdf_book_category',
});

SwitchWordOrder.belongsTo(SwitchWord, {
  foreignKey: 'switchword_id',
});
// Review -> User (Review written by User)
Reviews.belongsTo(User, {
  foreignKey: 'review_by_id',
  targetKey: 'user_uni_id',
  as: 'review_by_user'
});

Reviews.belongsTo(Customer, {
  foreignKey: 'review_by_id',
  targetKey: 'customer_uni_id',
  as: 'review_by_customer'
});

Reviews.belongsTo(Astrologer, {
  foreignKey: 'review_for_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});

SanjeeviniOrder.belongsTo(Sanjeevini, {
  foreignKey: 'sanjeevini_id',
  as: 'sanjeevini' 
});


export const associateModels = () => {
  // User - Customer relationship
  UserModel.hasOne(CustomerModel, {
    foreignKey: "customer_uni_id",
    sourceKey: "user_uni_id",
    as: "customer"
  });

  CustomerModel.belongsTo(UserModel, {
    foreignKey: "customer_uni_id",
    targetKey: "user_uni_id",
    as: "user"
  });


  // User - Astrologer (user -> astrologer)
  UserModel.hasOne(Astrologer, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "user_uni_id",
    as: "astrologer"
  });

  // Astrologer - User (astrologer -> user)
  Astrologer.belongsTo(UserModel, {
    foreignKey: "astrologer_uni_id",
    targetKey: "user_uni_id",
    as: "user"
  });

  // User - ApiKey (user belongs to API key)
  UserModel.belongsTo(ApiKey, {
    foreignKey: "user_uni_id",
    targetKey: "user_uni_id",
    as: "apikey"
  });

  // BannerCategory - Banner relationship (Laravel-like)
  Banner.belongsTo(BannerCategory, {
    foreignKey: "banner_category_id",
    targetKey: "id",
    as: "category"
  });

  BannerCategory.hasMany(Banner, {
    foreignKey: "banner_category_id",
    sourceKey: "id",
    as: "banners"
  });

  UserModel.hasMany(CallHistory, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "user_uni_id",
    as: "callHistories"
  });

  CallHistory.belongsTo(UserModel, {
    foreignKey: "astrologer_uni_id",
    targetKey: "user_uni_id",
    as: "user"
  });
  CallHistory.findAll({
    include: [
      {
        model: UserModel,
        as: "user" // Ensure this matches the alias defined in the association
      }
    ]
  });
  CallHistory.belongsTo(Astrologer, {
    foreignKey: "astrologer_uni_id",
    targetKey: "astrologer_uni_id",
    as: "astrologer"
  });

  Astrologer.hasMany(CallHistory, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "astrologer_uni_id",
    as: "callHistories"
  });


  
Astrologer.hasMany(FollowersModel, {
  foreignKey: 'astrologer_uni_id',
  sourceKey: 'astrologer_uni_id',
  as: 'followers'
});


FollowersModel.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});


UserModel.hasMany(WalletModel, { foreignKey: 'user_uni_id', sourceKey: 'user_uni_id' });
WalletModel.belongsTo(UserModel, { foreignKey: 'user_uni_id', targetKey: 'user_uni_id' });

UserModel.hasMany(WithdrawalRequestModel, { foreignKey: 'user_uni_id', sourceKey: 'user_uni_id' });
WithdrawalRequestModel.belongsTo(UserModel, { foreignKey: 'user_uni_id', targetKey: 'user_uni_id' });

RoleModel.hasMany(UserModel, { foreignKey: 'role_id' });
UserModel.belongsTo(RoleModel, { foreignKey: 'role_id' });



};
