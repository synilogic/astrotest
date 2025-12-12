import axios from "axios";
import { getConfig } from "../configStore.js";

const VEDIC_ASTRO_API_KEY = getConfig("vedic_astro_api_key");
const COMPANY_NAME = getConfig("company_name");
const ADDRESS = getConfig("address");
const APP_URL = getConfig("app.url");
const EMAIL = getConfig("email");
const MOBILE_NO = getConfig("mobile_no");

const panchang = async (date, time_zone, latitude, longitude, time, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/panchang/panchang?api_key=${VEDIC_ASTRO_API_KEY}&date=${date}&tz=${time_zone}&lat=${latitude}&lon=${longitude}&time=${time}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const predictionDailyMoon = async (zodiac, date, show_same = true, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/prediction/daily-moon?api_key=${VEDIC_ASTRO_API_KEY}&zodiac=${zodiac}&date=${date}&show_same=${show_same}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const predictionWeeklyMoon = async (zodiac, week, show_same = true, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/prediction/weekly-moon?api_key=${VEDIC_ASTRO_API_KEY}&zodiac=${zodiac}&week=${week}&show_same=${show_same}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const predictionYearlyMoon = async (zodiac, year, show_same = true, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/prediction/yearly?api_key=${VEDIC_ASTRO_API_KEY}&zodiac=${zodiac}&year=${year}&show_same=${show_same}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const northKundliMatchWithAstroDetails = async (
    boy_dob,
    boy_tob,
    boy_time_zone,
    boy_latitude,
    boy_longitude,
    girl_dob,
    girl_tob,
    girl_time_zone,
    girl_latitude,
    girl_longitude,
    lang
) => {
    const url = `https://api.vedicastroapi.com/v3-json/matching/ashtakoot-with-astro-details?api_key=${VEDIC_ASTRO_API_KEY}&boy_dob=${boy_dob}&boy_tob=${boy_tob}&boy_tz=${boy_time_zone}&boy_lat=${boy_latitude}&boy_lon=${boy_longitude}&girl_dob=${girl_dob}&girl_tob=${girl_tob}&girl_tz=${girl_time_zone}&girl_lat=${girl_latitude}&girl_lon=${girl_longitude}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const southKundliMatchWithAstroDetails = async (
    boy_dob,
    boy_tob,
    boy_time_zone,
    boy_latitude,
    boy_longitude,
    girl_dob,
    girl_tob,
    girl_time_zone,
    girl_latitude,
    girl_longitude,
    lang
) => {
    const url = `https://api.vedicastroapi.com/v3-json/matching/dashakoot-with-astro-details?api_key=${VEDIC_ASTRO_API_KEY}&boy_dob=${boy_dob}&boy_tob=${boy_tob}&boy_tz=${boy_time_zone}&boy_lat=${boy_latitude}&boy_lon=${boy_longitude}&girl_dob=${girl_dob}&girl_tob=${girl_tob}&girl_tz=${girl_time_zone}&girl_lat=${girl_latitude}&girl_lon=${girl_longitude}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const aggregateMatch = async (
    boy_dob,
    boy_tob,
    boy_time_zone,
    boy_latitude,
    boy_longitude,
    girl_dob,
    girl_tob,
    girl_time_zone,
    girl_latitude,
    girl_longitude,
    lang
) => {
    const url = `https://api.vedicastroapi.com/v3-json/matching/aggregate-match?api_key=${VEDIC_ASTRO_API_KEY}&boy_dob=${boy_dob}&boy_tob=${boy_tob}&boy_tz=${boy_time_zone}&boy_lat=${boy_latitude}&boy_lon=${boy_longitude}&girl_dob=${girl_dob}&girl_tob=${girl_tob}&girl_tz=${girl_time_zone}&girl_lat=${girl_latitude}&girl_lon=${girl_longitude}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const nakshatraMatch = async (boy_star, girl_star, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/matching/nakshatra-match?api_key=${VEDIC_ASTRO_API_KEY}&boy_star=${boy_star}&girl_star=${girl_star}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const personalCharacteristics = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/personal-characteristics?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const ashtakvarga = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/ashtakvarga?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const divisionalChart = async (
    dob,
    tob,
    lat,
    lon,
    tz,
    div,
    lang,
    response_type = "",
    year = "",
    transit_date = ""
) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/divisional-charts?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&div=${div}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const chartImage = async (
    dob,
    tob,
    lat,
    lon,
    tz,
    div,
    color,
    style,
    font_size,
    font_style,
    colorful_planets,
    size,
    stroke,
    lang
) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/chart-image?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&div=${div}&color=${color}&style=${style}&font_size=${font_size}&font_style=${font_style}&colorful_planets=${colorful_planets}&size=${size}&stroke=${stroke}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const planetDetails = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/planet-details?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const mahadasha = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dashas/maha-dasha?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const currentMahadashaFull = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dashas/current-mahadasha-full?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const antardasha = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dashas/antar-dasha?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const currentSadeSati = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/extended-horoscope/current-sade-sati?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const yogaList = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/extended-horoscope/yoga-list?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const mangalDosh = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dosha/mangal-dosh?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const kaalsarpDosh = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dosha/kaalsarp-dosh?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const manglikDosh = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dosha/manglik-dosh?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const pitraDosh = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/dosha/pitra-dosh?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const kpHouses = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/extended-horoscope/kp-houses?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const kpPlanets = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/extended-horoscope/kp-planets?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const westernPlanets = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/western-planets?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const varshapalDetails = async (dob, tob, lat, lon, tz, lang) => {
    const url = `https://api.vedicastroapi.com/v3-json/extended-horoscope/varshapal-details?api_key=${VEDIC_ASTRO_API_KEY}&dob=${dob}&tob=${tob}&lat=${lat}&lon=${lon}&tz=${tz}&lang=${lang}`;
    const response = await axios.get(url);
    return response.data;
};

const matchingPDF = async (data = {}) => {
    const {
        boy_dob,
        boy_tob,
        boy_tz,
        boy_lat,
        boy_lon,
        girl_dob,
        girl_tob,
        girl_tz,
        girl_lat,
        girl_lon,
        lang,
        style,
        color,
        boy_pob,
        girl_pob,
        boy_name,
        girl_name,
    } = data;

    const url = `https://api.vedicastroapi.com/v3-json/pdf/matching?boy_dob=${encodeURIComponent(boy_dob)}&boy_tob=${encodeURIComponent(boy_tob)}&boy_tz=${encodeURIComponent(boy_tz)}&boy_lat=${encodeURIComponent(boy_lat)}&boy_lon=${encodeURIComponent(boy_lon)}&girl_dob=${encodeURIComponent(girl_dob)}&girl_tob=${encodeURIComponent(girl_tob)}&girl_tz=${encodeURIComponent(girl_tz)}&girl_lat=${encodeURIComponent(girl_lat)}&girl_lon=${encodeURIComponent(girl_lon)}&api_key=${VEDIC_ASTRO_API_KEY}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&color=${encodeURIComponent(color)}&boy_pob=${encodeURIComponent(boy_pob)}&girl_pob=${encodeURIComponent(girl_pob)}&boy_name=${encodeURIComponent(boy_name)}&girl_name=${encodeURIComponent(girl_name)}`;
    const response = await axios.get(url);
    return response.data;
};

const horoscopePDF = async (data = {}) => {
    const { name, dob, tob, lat, lon, tz, lang, style, color, pob, pdf_type } =
        data;

    const url = `https://api.vedicastroapi.com/v3-json/pdf/horoscope?name=${encodeURIComponent(name)}&dob=${encodeURIComponent(dob)}&tob=${encodeURIComponent(tob)}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&tz=${encodeURIComponent(tz)}&api_key=${VEDIC_ASTRO_API_KEY}&lang=${encodeURIComponent(lang)}&style=${encodeURIComponent(style)}&color=${encodeURIComponent(color)}&pob=${encodeURIComponent(pob)}&company_name=${encodeURIComponent(COMPANY_NAME)}&address=${encodeURIComponent(ADDRESS)}&website=${encodeURIComponent(APP_URL)}&email=${encodeURIComponent(EMAIL)}&phone=${encodeURIComponent(MOBILE_NO)}&pdf_type=${encodeURIComponent(pdf_type)}`;
    const response = await axios.get(url);
    return response.data;
};

const vedicAstro = {
    panchang,
    predictionDailyMoon,
    predictionWeeklyMoon,
    predictionYearlyMoon,
    northKundliMatchWithAstroDetails,
    southKundliMatchWithAstroDetails,
    aggregateMatch,
    nakshatraMatch,
    personalCharacteristics,
    ashtakvarga,
    divisionalChart,
    chartImage,
    planetDetails,
    mahadasha,
    currentMahadashaFull,
    antardasha,
    currentSadeSati,
    yogaList,
    mangalDosh,
    kaalsarpDosh,
    manglikDosh,
    pitraDosh,
    kpHouses,
    kpPlanets,
    westernPlanets,
    varshapalDetails,
    matchingPDF,
    horoscopePDF,
};

export default vedicAstro;