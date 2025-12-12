import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import env from '../_config/env.js';
import mysql from 'mysql2';
import astrologerlogin from './astrologerlogin.js';
import getAstrologer from './getAstrologers.js'; // Updated to match the correct casing.
import authenticateToken from  "../_middlewares/auth.js";
import saveastrologerdata from "./saveastrologerdata.js";
import getastroDashboard from "./getastroDashboard.js";
import getAstrologerDetail from "./getAstrologerDetail.js";
import astrologerFollow from "./astrologerFollow.js";
import astrologerUnfollow from "./astrologerUnfollow.js";
import getFollowing from "./getFollowing.js";
import path from 'path';
import giftItem from "./giftItem.js";
import sendGiftAstro from "./sendGiftAstro.js";
import updateFcmToken from "./updateFcmToken.js";
import blog from './blog.js';
import astrologerDiscount from './astrologerDiscount.js';

const PORT = process.env.PORT || env.ports.astrologers;

const app = express();
app.use(helmet());
dotenv.config();


const corsOptions = {
    origin: env.origin
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));


const prefix = "/api"
app.use('/uploads', express.static(path.resolve('public/uploads')));
app.use('/assets', express.static(path.resolve('public/assets')));

app.use( prefix,astrologerlogin);
app.use( prefix,getAstrologer);
app.use( prefix,saveastrologerdata);


app.use( prefix,getastroDashboard);
app.use( prefix,getAstrologerDetail);
app.use( prefix,astrologerFollow);
app.use( prefix,astrologerUnfollow);
app.use( prefix,getFollowing);
app.use( prefix,giftItem);
app.use( prefix,sendGiftAstro);
app.use( prefix,updateFcmToken);
app.use( prefix,blog);
app.use( prefix,astrologerDiscount);





app.listen(PORT, async () => {
    console.log(`Astrologer service is running on port ${PORT}.`);
});
