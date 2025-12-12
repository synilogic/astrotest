import Sequelize from 'sequelize';
import UserModel from "./users.js";
import CustomerModel from "./customers.js";
import Banner from "./banners.js";
import BannerCategory from "./banner_categories.js";
import Astrologer from "./astrologers.js";
import ApiKey from "./apikeys.js";
import AdminApiLog from "./admin_api_logs.js";
import AdminChatChannelHistory from "./admin_chat_channel_histories.js";
import AdminChatChannels from "./admin_chat_channels.js";
import DiscountAssign from "./astrologer_discount_assigns.js";
import AstrologerDiscount from "./astrologer_discounts.js";
import AstrologerDocument from "./astrologer_documents.js";
import AstrologerGallery from "./astrologer_galleries.js";
import OpenAIPrediction from "./open_ai_predictions.js";
import OpenAIProfile from "./open_ai_profiles.js";
import AstrologerGift from "./astrologer_gifts.js";
import SlotSchedule from "./slot_schedules.js";
import AstrologerPrice from "./astrologer_prices.js";
import AstrologerCategories from "./astrologer_categories.js";
import AstrologerLanguage from "./astrologerlanguage.js";
import AstrologerSkill from "./astrologerskill.js";
import Skills from "./skills.js";
import Languages from "./languages.js";
import Reviews from "./reviews.js";
import Category from "./categories.js";
import {ServiceAssign} from "./serviceAssign.js";
// import ServiceAssign from './service_assigns.js';
import CallHistory from "./call_history.js";
import Follower from "./followers.js";
import Vendor from "./vendor.js";
import BlogCategory from "./blogCategory.js";
import Blog from "./blog.js";
import BlogLike from "./blogLike.js";
import CourseOrder from './course_order.js';
import AskQuestion from './askQustion.js';
import  ChatChannel from './chatChannelModel.js';
import ChatChannelHistory from './chatChannelHistoryModel.js';
import Course from './courses.js';
import ServiceOrder from './serviceOrder.js';
import Service from './services.js';
import ServiceCategory from './serviceCategory.js';
import Intake from './IntakeModel.js';
import Order from './order.js';
import orderProduct from './orderProduct.js';
import UserAddress from './userAddress.js';
import Product from './product.js';
import Wallet from './wallet.js';
import LiveSchedule from './live_schedules.js';
import GiftModel from './gifts.js';
import OrderProductModel from './order_products.js';


export const initModels = () => {
  // User - Customer
  UserModel.hasOne(CustomerModel, {
    foreignKey: "customer_uni_id",
    sourceKey: "user_uni_id",
    as: "customer",
  });
  CustomerModel.belongsTo(UserModel, {
    foreignKey: "customer_uni_id",
    targetKey: "user_uni_id",
    as: "user",
  });      


  // User - Astrologer
  UserModel.hasOne(Astrologer, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "user_uni_id",
    as: "astrologer",
  });
  Astrologer.belongsTo(UserModel, {
  foreignKey: "astrologer_uni_id",
  targetKey: "user_uni_id",
  as: "user", // <== alias
});
  Astrologer.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'users'
  });


  //service assigns 
Astrologer.hasMany(ServiceAssign, {
  foreignKey: 'astrologer_uni_id',
  sourceKey: 'astrologer_uni_id',
  as: 'service_assigns',
});

ServiceAssign.belongsTo(Service, {
  foreignKey: 'service_id',
  as: 'service'
});

Service.hasMany(ServiceAssign, {
  foreignKey: 'service_id',
  as: 'assignments'  // optional reverse relation
});
ServiceOrder.belongsTo(UserModel, {
  foreignKey: 'customer_uni_id',
  targetKey: 'user_uni_id',
  as: 'user',
});


// User - OpenAIProfile 
  OpenAIProfile.belongsTo(UserModel, {
    foreignKey: "customer_uni_id",
    targetKey: "user_uni_id",
    as: "user",
  });
   
  // User - OpenAIPrediction 
  OpenAIPrediction.belongsTo(UserModel, {
    foreignKey: "user_uni_id",
    targetKey: "user_uni_id",
    as: "user",
  });
    OpenAIPrediction.belongsTo(CustomerModel, {
  foreignKey: 'user_uni_id',       // column in OpenAIPrediction
  targetKey: 'customer_uni_id',    // column in Customer
  as: 'customer'
  });
  CustomerModel.hasMany(OpenAIPrediction, {
    foreignKey: 'user_uni_id',
    sourceKey: 'customer_uni_id',
    as: 'predictions'
  });

// (Optional) If you're using customers:
ServiceOrder.belongsTo(CustomerModel, {
  foreignKey: 'customer_uni_id',
  targetKey: 'customer_uni_id',
  as: 'customer',
});
  // User - API Key
  UserModel.belongsTo(ApiKey, {
    foreignKey: "user_uni_id",
    targetKey: "user_uni_id",
    as: "apikey",
  });
  
  ApiKey.belongsTo(UserModel, {
    foreignKey: 'user_uni_id',
    targetKey: 'user_uni_id'
  });
  // In Astrologer model
Astrologer.hasOne(ApiKey, {
  foreignKey: 'user_uni_id',
  sourceKey: 'astrologer_uni_id',
  as: 'api_keys'
});

// In ApiKey model
ApiKey.belongsTo(Astrologer, {
  foreignKey: 'user_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});


  // Banner - BannerCategory
  Banner.belongsTo(BannerCategory, {
    foreignKey: "banner_category_id",
    targetKey: "id",
    as: "category",
  });
  BannerCategory.hasMany(Banner, {
    foreignKey: "banner_category_id",
    sourceKey: "id",
    as: "banners",
  });
//  Callhistory - UserModel
CallHistory.belongsTo(UserModel, {
  foreignKey: 'customer_uni_id',
  targetKey: 'user_uni_id',
  as: 'user'
});

CallHistory.belongsTo(CustomerModel, {
  foreignKey: 'customer_uni_id',
  targetKey: 'customer_uni_id',
  as: 'customer'
});

  // Astrologer - DiscountAssign
  DiscountAssign.belongsTo(Astrologer, {
    foreignKey: 'astrologer_uni_id',
    targetKey: 'astrologer_uni_id',
    as: 'astrologer'
  });
  Astrologer.hasMany(DiscountAssign, {
    foreignKey: 'astrologer_uni_id',
    sourceKey: 'astrologer_uni_id',
    as: 'discount_assigns'
  });

  // Astrologer - Reviews
  Astrologer.hasMany(Reviews, {
    foreignKey: "review_for_id",
    sourceKey: "astrologer_uni_id",
    as: "reviews",
  });

  Reviews.belongsTo(CustomerModel, {
    foreignKey: 'review_by_id',
    targetKey: 'customer_uni_id',
    as: 'customer'
  });
//slot_sechedule-astrologer 
SlotSchedule.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});

  // Astrologer - CallHistory
  Astrologer.hasMany(CallHistory, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "astrologer_uni_id",
    as: "call_history",
  });
  CallHistory.belongsTo(Astrologer, {
    foreignKey: 'astrologer_uni_id',
    targetKey: 'astrologer_uni_id',
    as: 'astrologer'
  });
    
  // Astrologer - Call Waiting (virtual via hook)
  Astrologer.hasOne(CallHistory, {
    foreignKey: 'astrologer_uni_id',
    sourceKey: 'astrologer_uni_id',
    as: 'call_waiting'
  });

  // Astrologer - Followers
  Astrologer.hasMany(Follower, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "astrologer_uni_id",
    as: "followers",
  });
// Follower -> User
Follower.belongsTo(UserModel, {
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id',
  as: 'user'
});
 Astrologer.hasMany(AstrologerPrice, {
  foreignKey: 'astrologer_uni_id',
  sourceKey: 'astrologer_uni_id',
  as: 'prices'
});

AstrologerPrice.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'astrologer'
});

  // Astrologer - Gallery
  Astrologer.hasMany(AstrologerGallery, {
    foreignKey: "astrologer_uni_id",
    sourceKey: "astrologer_uni_id",
    as: "gallery_images",
  });

  // Astrologer - Documents
  Astrologer.hasMany(AstrologerDocument, {
    foreignKey: "user_uni_id",
    sourceKey: "astrologer_uni_id",
    as: "document_images",
  });

  
 // Astrologer - Skills (Many-to-Many)
  Astrologer.belongsToMany(Skills, {
    through: AstrologerSkill,
    foreignKey: "astrologer_id",
    otherKey: "skill_id",
    as: "skills", // For filtering (required: true)
  });
  Astrologer.belongsToMany(Skills, {
    through: AstrologerSkill,
    foreignKey: "astrologer_id",
    otherKey: "skill_id",
    as: "all_skills", // For displaying (required: false)
  });
  Skills.belongsToMany(Astrologer, {
    through: AstrologerSkill,
    foreignKey: "skill_id",
    otherKey: "astrologer_id",
    as: "astrologers",
  });

  
  // Astrologer - Languages (Many-to-Many)
  Astrologer.belongsToMany(Languages, {
    through: AstrologerLanguage,
    foreignKey: "astrologer_id",
    otherKey: "language_id",
    as: "languages", // For filtering
  });
  Astrologer.belongsToMany(Languages, {
    through: AstrologerLanguage,
    foreignKey: "astrologer_id",
    otherKey: "language_id",
    as: "all_languages", // For display
  });
  Languages.belongsToMany(Astrologer, {
    through: AstrologerLanguage,
    foreignKey: "language_id",
    otherKey: "astrologer_id",
    as: "astrologers",
  });
  
  // Astrologer - Categories (Many-to-Many)
  Astrologer.belongsToMany(Category, {
    through: AstrologerCategories,
    foreignKey: "astrologer_id",
    otherKey: "category_id",
    as: "categories", // For filtering
  });
  Astrologer.belongsToMany(Category, {
    through: AstrologerCategories,
    foreignKey: "astrologer_id",
    otherKey: "category_id",
    as: "all_categories", // For display
  });
  Category.belongsToMany(Astrologer, {
    through: AstrologerCategories,
    foreignKey: "category_id",
    otherKey: "astrologer_id",
    as: "astrologers",
  });

  // Populate call_waiting summary
  Astrologer.addHook('afterFind', async (astrologer) => {
    if (!astrologer) return;

    const list = Array.isArray(astrologer) ? astrologer : [astrologer];
    const astrologerUniIds = list.map(a => a.astrologer_uni_id);

    const callHistories = await CallHistory.findAll({
      attributes: [
        'astrologer_uni_id',
        [Sequelize.fn('IFNULL', Sequelize.fn('SUM', Sequelize.col('waiting_time')), 0), 'total_waiting_time'],
        [Sequelize.fn('IFNULL', Sequelize.fn('SUM', Sequelize.literal('IF(waiting_time > 0, 1, 0)')), 0), 'total_queue_count']
      ],
      where: {
        astrologer_uni_id: astrologerUniIds,
        status: ['queue', 'queue_request', 'request', 'in-progress']
      },
      group: ['astrologer_uni_id'],
      raw: true
    });

    list.forEach(a => {
      a.call_waiting = callHistories.find(ch => ch.astrologer_uni_id === a.astrologer_uni_id) || {
        total_waiting_time: 0,
        total_queue_count: 0
      };
    });
    });

  // User Model
  UserModel.hasOne(Vendor, {
    foreignKey: "vendor_uni_id",
    sourceKey: "user_uni_id",
    as: "vendor",
  });

  // Vendor Model
  Vendor.belongsTo(UserModel, {
    foreignKey: "vendor_uni_id",
    targetKey: "user_uni_id",
    as: "user",
  });

  


  // Blog ↔ BlogCategory
  Blog.belongsTo(BlogCategory, {
    foreignKey: "blog_category_id",
    as: "blogcategory",
  });
  BlogCategory.hasMany(Blog, { foreignKey: "blog_category_id", as: "blogs" });

  // Blog ↔ User
  Blog.belongsTo(UserModel, {
    foreignKey: "auth_id",
    targetKey: "user_uni_id",
    as: "user",
  });

  // Blog ↔ Astrologer
  Blog.belongsTo(Astrologer, {
    foreignKey: "auth_id",
    targetKey: "astrologer_uni_id",
    as: "astrologer",
  });
  Astrologer.hasMany(Blog, {
  foreignKey: 'auth_id',
  sourceKey: 'astrologer_uni_id',
  as: 'blogs'
});

  // Blog ↔ Follower
  Blog.hasMany(Follower, {
  foreignKey: 'astrologer_uni_id', // from Follower model
  sourceKey: 'auth_id',            // from Blog model
  as: 'followers'
});

Follower.belongsTo(Blog, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'auth_id',
  as: 'blog'
});

Follower.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',
  targetKey: 'astrologer_uni_id', // assuming this is the primary key in Astrologer
  as: 'astrologer'
});



  // Blog ↔ BlogLike
  Blog.hasMany(BlogLike, { foreignKey: "blog_id", as: "blog_likes" });
  BlogLike.belongsTo(Blog, { foreignKey: "blog_id", as: "blog" });

  // BlogCategory ↔ BlogCategory (Hierarchy)
  BlogCategory.hasMany(BlogCategory, {
    foreignKey: "parent_id",
    as: "children",
  });
  BlogCategory.belongsTo(BlogCategory, {
    foreignKey: "parent_id",
    as: "parent",
  });


  // Add these associations after the existing CallHistory associations
  CallHistory.belongsTo(UserModel, {
    foreignKey: 'customer_uni_id',
    targetKey: 'user_uni_id',
    as: 'customer_user'
  });

  CallHistory.belongsTo(UserModel, {
    foreignKey: 'astrologer_uni_id',
    targetKey: 'user_uni_id',
    as: 'astrologer_user'
  });

  CourseOrder.belongsTo(Course, {
  foreignKey: 'course_id',
  as: 'course'
});

AskQuestion.belongsTo(UserModel, { as: 'user_customer', foreignKey: 'customer_uni_id', targetKey: 'user_uni_id' });
AskQuestion.belongsTo(CustomerModel, { as: 'customer', foreignKey: 'customer_uni_id', targetKey: 'customer_uni_id' });
AskQuestion.belongsTo(UserModel, { as: 'user_astrologer', foreignKey: 'astrologer_uni_id', targetKey: 'user_uni_id' });
AskQuestion.belongsTo(Astrologer, { as: 'astrologer', foreignKey: 'astrologer_uni_id', targetKey: 'astrologer_uni_id' });
////
ChatChannel.belongsTo(CustomerModel, { 
  foreignKey: 'user_uni_id',
  targetKey: 'customer_uni_id',
  as: "customer" 
});
ChatChannel.belongsTo(Astrologer, { 
  foreignKey: 'user_uni_id',
  targetKey: 'astrologer_uni_id',
  as: "astrologer" 
});
ChatChannel.belongsTo(UserModel, { 
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id',
  as: "customerUser" 
});

//this code is match bhupendra

// ChatChannel.belongsTo(CustomerModel, { 
//   foreignKey: 'customer_uni_id',
//   targetKey: 'customer_uni_id',
//   as: "customer" 
// });


////get err save chat

// ChatChannel.belongsTo(Astrologer, { 
//   foreignKey: 'astrologer_uni_id',
//   targetKey: 'astrologer_uni_id',
//   as: "astrologers" 
// });

// ChatChannel.belongsTo(UserModel, { 
//   foreignKey: 'customer_uni_id',
//   targetKey: 'user_uni_id',
//   as: "customerUser" 
// });

// ChatChannel.belongsTo(UserModel, { 
//   foreignKey: 'astrologer_uni_id',
//   targetKey: 'user_uni_id',
//   as: "astrologerUser" 
// });

////get err save chat

// ChatChannel.belongsTo(UserModel, { 
//   foreignKey: 'astrologer_uni_id',
//   targetKey: 'user_uni_id',
//   as: "astrologerUser" 
// });
ChatChannel.belongsTo(UserModel, { 
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id',
  as: "astrologerUser" 
});



ChatChannelHistory.belongsTo(UserModel, { 
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id', 
  as: 'user' 
});
ChatChannelHistory.belongsTo(Astrologer, {
  foreignKey: 'user_uni_id', 
  targetKey: 'astrologer_uni_id', 
  as: 'astrologer' 
});


ChatChannelHistory.belongsTo(CustomerModel, {
  foreignKey: 'user_uni_id', 
  targetKey: 'customer_uni_id', 
  as: 'customer' 
}); 



Service.belongsTo(ServiceCategory, {
  foreignKey: 'service_category_id',
  as: 'category' // or 'serviceCategory' if you prefer
});

ServiceCategory.hasMany(Service, {
  foreignKey: 'service_category_id',
  as: 'services'
});

CallHistory.belongsTo(Intake, {
  foreignKey: 'uniqeid',
  targetKey: 'uniqeid',
  as: 'intake'
});


Intake.hasMany(CallHistory, {
  foreignKey: 'uniqeid',
  sourceKey: 'uniqeid',
  as: 'call_history'
});


    Order.hasMany(OrderProductModel, {
  foreignKey: 'order_id',
  sourceKey: 'order_id',
  as: 'order_products'
});

OrderProductModel.belongsTo(Order, {
  foreignKey: 'order_id',
  targetKey: 'order_id',
  as: 'order'
});

    // address: belongsTo
    Order.belongsTo(UserAddress, {
      foreignKey: 'address_id',
      targetKey: 'id',
      as: 'address'
    });

    orderProduct.belongsTo(Product, {
      foreignKey: 'product_id',
      targetKey: 'id',
      as: 'product'
    });

    Wallet.belongsTo(UserModel, {
  foreignKey: 'user_uni_id',
  targetKey: 'user_uni_id',
});




CallHistory.belongsTo(Wallet, {
    foreignKey: 'customer_uni_id',
    targetKey: 'user_uni_id',
    as: 'Wallet'
  })





UserModel.hasMany(Wallet, { foreignKey: 'user_uni_id', sourceKey: 'user_uni_id', as:'wallets' });



CallHistory.hasMany(Wallet, {
  foreignKey: 'user_uni_id',
  sourceKey: 'astrologer_uni_id',
  as: 'wallets',
  constraints: false // allows custom join conditions
});

Wallet.belongsTo(CallHistory, {
  foreignKey: 'user_uni_id',
  targetKey: 'astrologer_uni_id',
  as: 'call_history',
  constraints: false // needed to allow custom ON clause
});


CallHistory.hasMany(Wallet, {
  foreignKey: 'user_uni_id',
  sourceKey: 'customer_uni_id',
  as: 'customer_wallets',
  constraints: false,
});



  AstrologerGift.belongsTo(UserModel, {
      foreignKey: "user_id",
      targetKey: "user_uni_id",
      as: "user_astrologer",
    });

    AstrologerGift.belongsTo(UserModel, {
      foreignKey: "user_id",
      targetKey: "user_uni_id",
      as: "user_customer",
    });
    
    AstrologerGift.belongsTo(GiftModel, {
      foreignKey: "gift_id",
      as: "gift",
    });
    
    AstrologerGift.belongsTo(Astrologer, {
      foreignKey: "astrologer_uni_id",
      targetKey: "astrologer_uni_id",
      as: "astrologer",
    });

    AstrologerGift.belongsTo(CustomerModel, {
      foreignKey: 'user_id',
      targetKey: 'customer_uni_id',
      as: 'customer',
    });

ServiceOrder.belongsTo(Astrologer, {
  foreignKey: 'astrologer_uni_id',   // Column in service_orders table
  targetKey: 'astrologer_uni_id',    // Column in astrologers table
  as: 'astrologerService'
});


ServiceOrder.belongsTo(UserModel, {
  foreignKey: 'customer_uni_id',   
  targetKey: 'user_uni_id',   
  as: 'userService'
});

LiveSchedule.belongsTo(Astrologer, {
   foreignKey: 'astrologer_uni_id',
   targetKey: 'astrologer_uni_id', 
   as: 'astrologer'
 });

   Astrologer.hasMany(LiveSchedule, {
     foreignKey: "astrologer_uni_id",
     sourceKey: "astrologer_uni_id",
     as: "liveschedule",
   });

 Follower.belongsTo(CustomerModel, { foreignKey: 'user_uni_id', targetKey: 'customer_uni_id', as: 'customer' });

}

ServiceOrder.belongsTo(UserModel, {
  foreignKey: 'customer_uni_id',   
  targetKey: 'user_uni_id',   
  as: 'user_customer'
});