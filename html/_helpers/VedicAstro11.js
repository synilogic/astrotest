import axios from 'axios';
class VedicAstro {
  constructor() {
    this.vedicAstroApiKey = '1fa73a93-f407-512d-990a-faef721b42f8';
  }
  async chartImage(params) {
    const {
      dob,
      tob,
      lat,
      lon,
      tz,
      div,
      color,
      style,
      fontSize,
      fontStyle,
      colorfulPlanets,
      size,
      stroke,
      lang,
      transit_date
    } = params;
    // Validate required parameters
    if (!dob || !tob || !lat || !lon || !tz) {
      throw new Error('Missing required parameters');
    }
    // Clean up values
    const clean = (val) => (typeof val === 'string' ? val.trim() : val);
    const queryParams = new URLSearchParams({
      api_key: clean(this.vedicAstroApiKey),
      dob: clean(dob),
      tob: clean(tob),
      lat: clean(lat),
      lon: clean(lon),
      tz: clean(tz),
      div: clean(div),
      color: clean(color),
      style: clean(style),
      font_size: clean(fontSize),
      font_style: clean(fontStyle),
      colorful_planets: clean(colorfulPlanets),
      size: clean(size),
      stroke: clean(stroke),
      lang: clean(lang),
      transit_date: clean(transit_date),
    });
    // Construct the URL dynamically
    const url = `https://api.vedicastroapi.com/v3-json/horoscope/chart-image?${queryParams.toString()}`;
    console.log("Constructed URL:", url);  // Log the final URL to verify

    try {
      console.log("Sending request...");
     //  return url;
      const response = await axios.get(url, {
        headers: {
          // 'Accept': 'application/json',
          'Content-Type': 'application/xml',
        },
        timeout: 10000, // Timeout after 10 seconds
        maxBodyLength: Infinity,
      });

     // console.log("API Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("VedicAstro.chartImage error:", error.message);

      if (error.code) {
        console.error("Axios error code:", error.code);
      }

      if (error.config) {
        console.error("Axios config:", error.config);
      }

      if (error.response) {
        console.error("Error response data:", error.response.data);
      } else if (error.request) {
        console.error("No response received. Axios request object:", error.request);
      }

      throw new Error('Internal server error');
    }

  }
}
export default VedicAstro;