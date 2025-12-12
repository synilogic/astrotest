import axios from "axios";
import { getConfig } from "../configStore.js";
import fetch from "node-fetch";

const JYOTISHAM_API_URL = "https://api.jyotishamastroapi.com/api";
const JYOTISHAM_API_KEY = '2a10httTVHmUvXBp0Ea20SgStu80DF';
console.log("api key",JYOTISHAM_API_KEY);
const COMPANY_NAME = "Microsoft";
const ADDRESS = "Mumbai, Maharashtra";
const APP_URL = "www.synilogictech.com";
const EMAIL = "microsf@gmail.com";
const MOBILE_NO = "+91 8894676565";


const panchang = async (date, time_zone, latitude, longitude, time, lang) => {
  const url = `${JYOTISHAM_API_URL}/panchang/panchang?date=${date}&tz=${time_zone}&latitude=${latitude}&longitude=${longitude}&time=${time}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });

  console.log("responsehere",response);
  return response.data;
};

const kundliMatching = async (
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
  lang,
  matching_astro_type = "ashtakoot-astro"
) => {
  const url = `${JYOTISHAM_API_URL}/matching/${matching_astro_type}?boy_dob=${boy_dob}&boy_tob=${boy_tob}&boy_tz=${boy_time_zone}&boy_lat=${boy_latitude}&boy_lon=${boy_longitude}&girl_dob=${girl_dob}&girl_tob=${girl_tob}&girl_tz=${girl_time_zone}&girl_lat=${girl_latitude}&girl_lon=${girl_longitude}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const nakshatraMatching = async (boy_nakshatra, girl_nakshatra, lang) => {
  const url = `${JYOTISHAM_API_URL}/matching/nakshatra-match?boy_nakshatra=${boy_nakshatra}&girl_nakshatra=${girl_nakshatra}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const extendedKundali = async (
  date,
  time,
  latitude,
  longitude,
  tz,
  lang,
  kundali_type = "extended_kundali"
) => {
  const url = `${JYOTISHAM_API_URL}/extended_horoscope/${kundali_type}?date=${date}&time=${time}&latitude=${latitude}&longitude=${longitude}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};


const chartImage = async (dob, tob, latitude, longitude, tz, color, style, colored_planets, lang) => {
  try {
    console.log("🧾 Input:", dob, tob, latitude, longitude, tz, color, style, colored_planets, lang);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const url = `https://api.jyotishamastroapi.com/api/chart_image/d1?date=${dob}&time=${tob}&latitude=${latitude}&longitude=${longitude}&tz=${tz}&style=${style}&lang=${lang}&color=${color}&colored_planets=${colored_planets}`;
    console.log("🔗 URL:", url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'key': JYOTISHAM_API_KEY,
      },
     
    });

    clearTimeout(timeoutId);

    console.log("✅ Response object:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    console.log("🔍 Content-Type:", contentType);

    // Handle different response types
    if (contentType && contentType.includes("image/svg+xml")) {
      const svgText = await response.text();
      console.log("✅ Received SVG data:", svgText.substring(0, 100) + "...");
      return svgText;
    } else if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("📦 API response data:", data);
      return data;
    } else {
      // For any other content type, try to get as text first
      const textResponse = await response.text();
      console.warn("⚠️ Unexpected content-type:", contentType);
      console.warn("⚠️ Raw response:", textResponse.substring(0, 200) + "...");
      
      // Try to parse as JSON if it looks like JSON
      try {
        const jsonData = JSON.parse(textResponse);
        console.log("📦 Successfully parsed as JSON:", jsonData);
        return jsonData;
      } catch (e) {
        console.log("📝 Returning as text response");
        return textResponse;
      }
    }

  } catch (error) {
    console.error("❌ Error in chartImage:", error);
    return null;
  }
};

const horoscope = async (
  date,
  time,
  latitude,
  longitude,
  tz,
  lang,
  division = "",
  horoscope_type = "planet-details"
) => {
  let url = `${JYOTISHAM_API_URL}/horoscope/${horoscope_type}?date=${date}&time=${time}&latitude=${latitude}&longitude=${longitude}&tz=${tz}&lang=${lang}`;
  if (division) url += `&division=${division}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};
function formatDateIfNeeded(dateStr) {
  // If already in dd/mm/yyyy, return as-is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

  // If in yyyy-mm-dd, convert to dd/mm/yyyy
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTimeTo24Hour(timeStr) {
  if (!timeStr) return null;

  // Already in HH:mm 24-hour format
  if (/^\d{2}:\d{2}$/.test(timeStr.trim())) {
    return timeStr.trim();
  }

  // Convert from 12-hour format with AM/PM to 24-hour
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    throw new Error("Enter time in format hh:mm (24-hour)");
  }

  let [_, hour, minute, period] = match;
  hour = parseInt(hour, 10);
  minute = parseInt(minute, 10);
  period = period.toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}


const horoscopePDF = async (data = {}) => {
  const { name, dob, tob, lat, lon, tz, lang, style, pob, pdf_type } = data;

  const formattedDob = formatDateIfNeeded(dob);
  const formattedTOB = formatTimeTo24Hour(tob);

  if (!formattedDob) {
    throw new Error("Invalid date format for DOB");
  }
  const params = new URLSearchParams({
  name: name,
  date: formattedDob,
  time: formattedTOB,
  lat: lat,
  lon: lon,
  tz: tz,
  lang: lang,
  style:"north",
  place: pob,
  company_name: "Microsoft",
  company_address: "Mumbai, Maharashtra",
  company_email: "microsf@gmail.com",
  company_phone: "+91 8894676565",
  company_website: "www.synilogictech.com",
  pdf_type: "small"
    }).toString();
console.log("params1",params);
const fullUrl = `https://api.jyotishamastroapi.com/api/pdf/generate?${params}`;
   console.log("url here",fullUrl);
  const response = await axios.get(fullUrl, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const planetDetails = async (dob, tob, lat, lon, tz, lang) => {
  const url = `${JYOTISHAM_API_URL}/horoscope/planet-details?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const mahadasha = async (dob, tob, lat, lon, tz, lang) => {
  const url = `${JYOTISHAM_API_URL}/dasha/mahadasha?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const currentMahadashaFull = async (dob, tob, lat, lon, tz, lang) => {
  const url = `${JYOTISHAM_API_URL}/dasha/current-mahadasha-full?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const currentSadeSati = async (dob, tob, lat, lon, tz, lang) => {
  const url = `${JYOTISHAM_API_URL}/extended_horoscope/current_sadesati?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const dosha = async (dob, tob, lat, lon, tz, lang, dosha_type) => {
  const url = `${JYOTISHAM_API_URL}/dosha/${dosha_type}?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const kpPlanets = async (dob, tob, lat, lon, tz, lang) => {
  const url = `${JYOTISHAM_API_URL}/extended_horoscope/planets_kp?date=${dob}&time=${tob}&latitude=${lat}&longitude=${lon}&tz=${tz}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const divisionalChart = async (
  date,
  time,
  latitude,
  longitude,
  tz,
  division = "",
  lang
) => {
  const url = `${JYOTISHAM_API_URL}/horoscope/divisonal-chart?date=${date}&time=${time}&latitude=${latitude}&longitude=${longitude}&tz=${tz}&division=${division}&lang=${lang}`;
  const response = await axios.get(url, {
    headers: { key: JYOTISHAM_API_KEY },
  });
  return response.data;
};

const jyotishamAstro = {
  panchang,
  kundliMatching,
  nakshatraMatching,
  extendedKundali,
  chartImage,
  horoscope,
  horoscopePDF,
  planetDetails,
  mahadasha,
  currentMahadashaFull,
  currentSadeSati,
  dosha,
  kpPlanets,
  divisionalChart,
};

export default jyotishamAstro;