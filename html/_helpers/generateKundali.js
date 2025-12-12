import moment from 'moment-timezone';
import { getConfig } from '../configStore.js';
import jyotishamAstro from './JyotishamAstro.js'
import vedicAstro from './VedicAstro.js'


export const formatDate = (date) => {
    const formats = ['DD-MM-YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MM-DD-YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD', 'DD.MM.YYYY'];

    for (const format of formats) {
        const parsedDate = moment(date, format, true);
        if (parsedDate.isValid()) {
            return parsedDate.format('DD/MM/YYYY');
        }
    }

    return false;
};

export const formatTime = (time) => {
    const formats = ['HH:mm:ss', 'HH:mm', 'h:mm A', 'h:mm a'];

    for (const formats of formats) {
        const parsedTime = moment(time, format, true);
        if (parsedTime.isValid()) {
            return parsedTime.format('HH:mm');
        }
    }

    return false;
};



export const planetDetailsDataFormat = async (data = {}) => {
  try {
    const response = data?.response;
    const formattedData = {};

    if (response) {
      formattedData.PlanetaryPositions = [];

      for (const key in response) {
        const val = response[key];
        if (typeof val === 'object' && val?.name) {
          formattedData.PlanetaryPositions.push({
            Planet: val.name ?? '-',
            'Full Name': val.full_name ?? '-',
            'Degree (Local)': val.local_degree !== undefined ? +val.local_degree.toFixed(2) : null,
            'Degree (Global)': val.global_degree !== undefined ? +val.global_degree.toFixed(2) : null,
            Zodiac: val.zodiac ?? '-',
            House: val.house ?? '-',
            Nakshatra: val.nakshatra ?? '-',
            'Nakshatra Lord': val.nakshatra_lord ?? '-',
            Pada: val.nakshatra_pada ?? '-',
            'Zodiac Lord': val.zodiac_lord ?? '-',
            'Is Combust': val.is_combust !== undefined ? (val.is_combust ? 'Yes' : 'No') : '-',
            'Is Set': val.is_planet_set !== undefined ? (val.is_planet_set ? 'Yes' : 'No') : '-',
            'Basic Avastha': val.basic_avastha ?? '-',
            'Lord Status': val.lord_status ?? '-'
          });
        }
      }

      formattedData.BirthDetailsAndLuckyElements = {
        'Birth Dasha': `${response.birth_dasa} (Started on ${response.birth_dasa_time})`,
        'Current Dasha': `${response.current_dasa} (Effective from ${response.current_dasa_time})`,
        'Zodiac Sign (Rasi)': response.rasi,
        'Nakshatra': `${response.nakshatra} (Pada ${response.nakshatra_pada})`,
        'Lucky Gem': Array.isArray(response.lucky_gem) ? response.lucky_gem.join(', ') : '',
        'Lucky Numbers': Array.isArray(response.lucky_num) ? response.lucky_num.join(', ') : '',
        'Lucky Colors': Array.isArray(response.lucky_colors) ? response.lucky_colors.join(', ') : '',
        'Lucky Letters': Array.isArray(response.lucky_letters) ? response.lucky_letters.join(', ') : '',
        'Lucky Name Start': Array.isArray(response.lucky_name_start) ? response.lucky_name_start.join(', ') : ''
      };

      formattedData.PanchangDetails = {
        Ayanamsa: `${response.panchang?.ayanamsa}° ${response.panchang?.ayanamsa_name}`,
        'Day of Birth': response.panchang?.day_of_birth,
        'Day Lord': response.panchang?.day_lord,
        'Hora Lord': response.panchang?.hora_lord,
        Sunrise: response.panchang?.sunrise_at_birth,
        Sunset: response.panchang?.sunset_at_birth,
        Karana: response.panchang?.karana,
        Yoga: response.panchang?.yoga,
        Tithi: response.panchang?.tithi
      };

      formattedData.GhatkaChakra = {
        Rasi: response.ghatka_chakra?.rasi,
        Tithi: Array.isArray(response.ghatka_chakra?.tithi) ? response.ghatka_chakra.tithi.join(', ') : '',
        Day: response.ghatka_chakra?.day,
        Nakshatra: response.ghatka_chakra?.nakshatra,
        Tatva: response.ghatka_chakra?.tatva,
        Lord: response.ghatka_chakra?.lord,
        'Same-sex Lagna': response.ghatka_chakra?.same_sex_lagna,
        'Opposite-sex Lagna': response.ghatka_chakra?.opposite_sex_lagna
      };
    }

    return formattedData;
  } catch (error) {
    console.error('Error in planetDetailsDataFormat:', error);
    return {
      PlanetaryPositions: [],
      BirthDetailsAndLuckyElements: {},
      PanchangDetails: {},
      GhatkaChakra: {}
    };
  }
};


const currentMahadashaFullDataFormat = (data = {}) => {
  try {
    const response = data?.response || {};
    const formattedData = {};

    if (Array.isArray(response.mahadasha)) {
      formattedData.MajorDasha = response.mahadasha.map(dasha => {
        const start = dasha?.start?.replace(' GMT+0000 (Coordinated Universal Time)', '') || '';
        const end = dasha?.end?.replace(' GMT+0000 (Coordinated Universal Time)', '') || '';

        return {
          Planet: dasha.name ?? '-',
          'Start Date': start ? new Date(start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
          'End Date': end ? new Date(end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
        };
      });
    }

    const dashas = response.order_of_dashas;
    if (dashas?.major && dashas?.minor && dashas?.sub_minor && dashas?.sub_sub_minor) {
      const formatDate = str =>
        str ? new Date(str.replace(' GMT+0000 (Coordinated Universal Time)', '')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

      formattedData.CurrentDashaPeriod = {
        'Major Dasha': `${dashas.major.name} (${formatDate(dashas.major.start)} - ${formatDate(dashas.major.end)})`,
        'Antardasha': `${dashas.minor.name} (${formatDate(dashas.minor.start)} - ${formatDate(dashas.minor.end)})`,
        'Paryantardasha': `${dashas.sub_minor.name} (${formatDate(dashas.sub_minor.start)} - ${formatDate(dashas.sub_minor.end)})`,
        'Shookshama Dasha': `${dashas.sub_sub_minor.name} (${formatDate(dashas.sub_sub_minor.start)} - ${formatDate(dashas.sub_sub_minor.end)})`
      };
    }

    return formattedData;
  } catch (error) {
    console.error('Error in currentMahadashaFullDataFormat:', error);
    return {
      MajorDasha: [],
      CurrentDashaPeriod: {
        'Major Dasha': '-',
        'Antardasha': '-',
        'Paryantardasha': '-',
        'Shookshama Dasha': '-'
      }
    };
  }
};



export const generateVedicAstroAIKundali = async (user_data) => {
  try {
    const customer = user_data;

    if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
      return false;
    }

    const date = customer.dob;
    const time = customer.tob;
    const lat = customer.lat;
    const lon = customer.lon;
    const tz = customer.tz || '5.5';
    const div = 'D1';
    const color = '%23ff3366';
    const style = 'north'; // south
    const font_size = '12';
    const font_style = 'Nunito';
    const colorful_planets = '0';
    const size = '400';
    const stroke = '2';
    const lang = 'en';

    const formattedDob = formatDate(date);
    if (!formattedDob) return false;

    const formattedTob = formatTime(time);
    if (!formattedTob) return false;

    let response = {};

    if (!getConfig('kundli_api_status') && getConfig('kundli_api_status') === 3) {
      try {
        const planetDetails = await jyotishamAstro.planetDetails(
          formattedDob, formattedTob, lat, lon, tz, lang
        );

        const currentMahadashaFull = await jyotishamAstro.currentMahadashaFull(
          formattedDob, formattedTob, lat, lon, tz, lang
        );

        const formattedPlanetDetails =
          planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';
        const formattedCurrentMahadasha =
          currentMahadashaFull?.status === 200 ? currentMahadashaFullDataFormat(currentMahadashaFull) : '';

        response = {
          planetDetails: formattedPlanetDetails,
          currentMahadashaFull: formattedCurrentMahadasha
        };
      } catch (error) {
        console.error('Error in Jyotisham API calls:', error);
        throw error;
      }
    } else {
      try {
        const planetDetails = await vedicAstro.planetDetails(
          formattedDob, formattedTob, lat, lon, tz, lang
        );

        const currentMahadashaFull = await vedicAstro.currentMahadashaFull(
          formattedDob, formattedTob, lat, lon, tz, lang
        );

        const formattedPlanetDetails =
          planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';
        const formattedCurrentMahadasha =
          currentMahadashaFull?.status === 200 ? currentMahadashaFullDataFormat(currentMahadashaFull) : '';

        response = {
          planetDetails: formattedPlanetDetails,
          currentMahadashaFull: formattedCurrentMahadasha
        };
      } catch (error) {
        console.error('Error in Vedic API calls:', error);
        throw error;
      }
    }

    return response;
  } catch (error) {
    console.error('Error in generateVedicAstroAIKundali:', error);
    return false;
  }
};


export const generateVedicAstroKPKundali = async (user_data) => {
  try {
      const customer = user_data;

      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let dob = customer.dob;
      let tob = customer.tob;
      const lat = customer.lat;
      const lon = customer.lon;
      const tz = customer.tz || '5.5';
      const div = 'D1';
      const color = '%23ff3366';
      const style = 'north';
      const font_size = '12';
      const font_style = 'Nunito';
      const colorful_planets = '0';
      const size = '400';
      const stroke = '2';
      const lang = 'en';

      dob = formatDate(dob);
      if (!dob) return false;

      tob = formatTime(tob);
      if (!tob) return false;

      let response = {};

        if (!getConfig('kundli_api_status') && getConfig('kundli_api_status') === 3) {
          // const jyotishamAstro = new JyotishamAstro();

          const planetDetails = await jyotishamAstro.planetDetails(dob, tob, lat, lon, tz, lang);
          const divisionalChalitChart = await jyotishamAstro.divisionalChart(dob, tob, lat, lon, tz, 'chalit', lang);
          const kpPlanets = await jyotishamAstro.kpPlanets(dob, tob, lat, lon, tz, lang);
          const kpHouses = ''; // disabled as per original code

          const formattedPlanetDetails =
              planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';

          const formattedDivisionalChalitChart =
              divisionalChalitChart?.status === 200 ? bhavChalitChartDataFormat(divisionalChalitChart) : '';

          const formattedKPHouses =
              kpHouses?.status === 200 ? kPHousesDataFormat(kpHouses) : '';

          const formattedKPPlanets =
              kpPlanets?.status === 200 ? kPPlanetaryPositionDataFormat(kpPlanets) : '';

          response = {
              planetDetails: formattedPlanetDetails,
              divisionalChalitChart: formattedDivisionalChalitChart,
              kpHouses: formattedKPHouses,
              kpPlanets: formattedKPPlanets
          };
      } else {
          const vedicAstro = new VedicAstro();

          const planetDetails = await vedicAstro.planetDetails(dob, tob, lat, lon, tz, lang);
          const divisionalChalitChart = await vedicAstro.divisionalChart(dob, tob, lat, lon, tz, 'chalit', lang);
          const kpHouses = await vedicAstro.kpHouses(dob, tob, lat, lon, tz, lang);
          const kpPlanets = await vedicAstro.kpPlanets(dob, tob, lat, lon, tz, lang);

          const formattedPlanetDetails =
              planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';

          const formattedDivisionalChalitChart =
              divisionalChalitChart?.status === 200 ? bhavChalitChartDataFormat(divisionalChalitChart) : '';

          const formattedKPHouses =
              kpHouses?.status === 200 ? kPHousesDataFormat(kpHouses) : '';

          const formattedKPPlanets =
              kpPlanets?.status === 200 ? kPPlanetaryPositionDataFormat(kpPlanets) : '';

          response = {
              planetDetails: formattedPlanetDetails,
              divisionalChalitChart: formattedDivisionalChalitChart,
              kpHouses: formattedKPHouses,
              kpPlanets: formattedKPPlanets
          };
      }

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroKPKundali:', error);
      return false;
  }
};



export const generateVedicAstroPrashnaKundali = async (user_data) => {
  try {
    const customer = user_data;

    if (customer.dob && customer.tob && customer.lon && customer.lat) {
      let { lat, lon } = customer;
      const tz = customer.tz || '5.5';
      const lang = 'en';

      let dob = formatDate(customer.dob);
      if (!dob) return false;

      let tob = formatTime(customer.tob);
      if (!tob) return false;

      let response = {};

      // Get current date and time from environment or config
      const currentDate = process.env.CURRENT_DATE || new Date().toISOString().split('T')[0]; // yyyy-mm-dd
      const currentTime = process.env.CURRENT_TIME || new Date().toTimeString().slice(0, 5);   // HH:mm

      const formattedCurrentDate = formatDate(currentDate);
      const formattedCurrentTime = formatTime(currentTime);

      if (!getConfig('kundli_api_status') && getConfig('kundli_api_status') === 3) {
        // const jyotishamAstro = new JyotishamAstro();

        const planetDetails = await jyotishamAstro.planetDetails(formattedCurrentDate, formattedCurrentTime, lat, lon, tz, lang);
        const currentMahadashaFull = await jyotishamAstro.currentMahadashaFull(formattedCurrentDate, formattedCurrentTime, lat, lon, tz, lang);

        const formattedPlanetDetails = planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';
        const formattedMahadasha = currentMahadashaFull?.status === 200 ? currentMahadashaFullDataFormat(currentMahadashaFull) : '';

        response = {
          planetDetails: formattedPlanetDetails,
          currentMahadashaFull: formattedMahadasha
        };

      } else {
        // const vedicAstro = new VedicAstro();

        const planetDetails = await vedicAstro.planetDetails(formattedCurrentDate, formattedCurrentTime, lat, lon, tz, lang);
        const currentMahadashaFull = await vedicAstro.currentMahadashaFull(formattedCurrentDate, formattedCurrentTime, lat, lon, tz, lang);

        const formattedPlanetDetails = planetDetails?.status === 200 ? planetDetailsDataFormat(planetDetails) : '';
        const formattedMahadasha = currentMahadashaFull?.status === 200 ? currentMahadashaFullDataFormat(currentMahadashaFull) : '';

        response = {
          planetDetails: formattedPlanetDetails,
          currentMahadashaFull: formattedMahadasha
        };
      }

      return response;
    } else {
      return false;
    }

  } catch (error) {
    console.error('Error in generateVedicAstroPrashnaKundali:', error);
    return false;
  }
};




export const generateVedicAstroCurrentMahadashaFullKundali = async (user_data) => {
  try {
      const customer = user_data;
      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let date = customer.dob;
      let time = customer.tob;

      let dob = date;
      let tob = time;
      let lat = customer.lat;
      let lon = customer.lon;
      let tz = customer.tz || '5.5';
      let div = 'D1';
      let color = '%23ff3366';
      let style = 'north'; // south
      let font_size = '12';
      let font_style = 'Nunito';
      let colorful_planets = '0';
      let size = '400';
      let stroke = '2';
      let lang = 'en';

      if (dob) {
          dob = formatDate(dob);
          if (!dob) {
              return false;
          }
      }

      if (tob) {
          tob = formatTime(tob);
          if (!tob) {
              return false;
          }
      }

      let response = {};
      if (!getConfig('kundli_api_status') && getConfig('kundli_api_status') === 3) {
          // const jyotishamAstro = new JyotishamAstro();
          let currentMahadashaFull = jyotishamAstro.currentMahadashaFull(dob, tob, lat, lon, tz, lang);

          if (currentMahadashaFull?.status === 200) {
              currentMahadashaFull = currentMahadashaFullDataFormat(currentMahadashaFull);
          } else {
              currentMahadashaFull = '';
          }

          response = { currentMahadashaFull };
      } else {
          // const vedicAstro = new VedicAstro();
          let currentMahadashaFull = vedicAstro.currentMahadashaFull(dob, tob, lat, lon, tz, lang);

          if (currentMahadashaFull?.status === 200) {
              currentMahadashaFull = currentMahadashaFullDataFormat(currentMahadashaFull);
          } else {
              currentMahadashaFull = '';
          }

          response = { currentMahadashaFull };
      }

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroCurrentMahadashaFullKundali:', error);
      return false;
  }
};



export const generateVedicAstroDoshasKundali = async (user_data) => {
  try {
      const customer = user_data; // In PHP, $customer is cast to object, but in JS, we assume user_data is already an object

      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let dob = customer.dob;
      let tob = customer.tob;
      const lat = customer.lat;
      const lon = customer.lon;
      const tz = customer.tz || '5.5';
      const div = 'D1';
      const color = '%23ff3366';
      const style = 'north'; // south
      const font_size = '12';
      const font_style = 'Nunito';
      const colorful_planets = '0';
      const size = '400';
      const stroke = '2';
      const lang = 'en';

      dob = formatDate(dob);
      if (!dob) {
          return false;
      }

      tob = formatTime(tob);
      if (!tob) {
          return false;
      }

      let response = {};

      if (!getConfig('kundli_api_status') && getConfig('kundli_api_status') === 3) {
          // JyotishamAstro API calls without class instantiation
          const mangalDosh = await jyotishamAstro.dosha(dob, tob, lat, lon, tz, lang, 'mangal_dosh');
          const kaalsarpDosh = await jyotishamAstro.dosha(dob, tob, lat, lon, tz, lang, 'kaalsarp-dosh');
          const manglikDosh = await jyotishamAstro.dosha(dob, tob, lat, lon, tz, lang, 'manglik-dosh');
          const pitraDosh = await jyotishamAstro.dosha(dob, tob, lat, lon, tz, lang, 'pitra-dosh');

          const formattedMangalDosh = mangalDosh?.status === 200 ? mangalDosh.response : '';
          const formattedKaalsarpDosh = kaalsarpDosh?.status === 200 ? kaalsarpDosh.response : '';
          const formattedManglikDosh = manglikDosh?.status === 200 ? manglikDosh.response : '';
          const formattedPitraDosh = pitraDosh?.status === 200 ? pitraDosh.response : '';

          response = {
              mangalDosh: formattedMangalDosh,
              kaalsarpDosh: formattedKaalsarpDosh,
              manglikDosh: formattedManglikDosh,
              pitraDosh: formattedPitraDosh
          };
      } else {
          // VedicAstro API calls without class instantiation
          const mangalDosh = await vedicAstro.mangalDosh(dob, tob, lat, lon, tz, lang);
          const kaalsarpDosh = await vedicAstro.kaalsarpDosh(dob, tob, lat, lon, tz, lang);
          const manglikDosh = await vedicAstro.manglikDosh(dob, tob, lat, lon, tz, lang);
          const pitraDosh = await vedicAstro.pitraDosh(dob, tob, lat, lon, tz, lang);

          const formattedMangalDosh = mangalDosh?.status === 200 ? mangalDosh.response : '';
          const formattedKaalsarpDosh = kaalsarpDosh?.status === 200 ? kaalsarpDosh.response : '';
          const formattedManglikDosh = manglikDosh?.status === 200 ? manglikDosh.response : '';
          const formattedPitraDosh = pitraDosh?.status === 200 ? pitraDosh.response : '';

          response = {
              mangalDosh: formattedMangalDosh,
              kaalsarpDosh: formattedKaalsarpDosh,
              manglikDosh: formattedManglikDosh,
              pitraDosh: formattedPitraDosh
          };
      }

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroDoshasKundali:', error);
      return false;
  }
};



export const generateVedicAstroBhavChalitKundali = async (user_data) => {
  try {
      const customer = user_data; 
      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let dob = customer.dob;
      let tob = customer.tob;
      const lat = customer.lat;
      const lon = customer.lon;
      const tz = customer.tz || '5.5';
      const div = 'D1';
      const color = '%23ff3366';
      const style = 'north'; // south
      const font_size = '12';
      const font_style = 'Nunito';
      const colorful_planets = '0';
      const size = '400';
      const stroke = '2';
      const lang = 'en';

      dob = formatDate(dob);
      if (!dob) {
          return false;
      }

      tob = formatTime(tob);
      if (!tob) {
          return false;
      }

      const divisionalChalitChart = await vedicAstro.divisionalChart(dob, tob, lat, lon, tz, 'chalit', lang);

      const formattedDivisionalChalitChart = 
          divisionalChalitChart?.status === 200 ? bhavChalitChartDataFormat(divisionalChalitChart) : '';

      const response = {
          divisionalChalitChart: formattedDivisionalChalitChart
      };

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroBhavChalitKundali:', error);
      return false;
  }
};


export const generateVedicAstroWesternPlanetsKundali = async (user_data) => {
  try {
      const customer = user_data;

      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let dob = customer.dob;
      let tob = customer.tob;
      const lat = customer.lat;
      const lon = customer.lon;
      const tz = customer.tz || '5.5';
      const div = 'D1';
      const color = '%23ff3366';
      const style = 'north'; // south
      const font_size = '12';
      const font_style = 'Nunito';
      const colorful_planets = '0';
      const size = '400';
      const stroke = '2';
      const lang = 'en';

      dob = formatDate(dob);
      if (!dob) {
          return false;
      }

      tob = formatTime(tob);
      if (!tob) {
          return false;
      }

      const westernPlanets = await vedicAstro.westernPlanets(dob, tob, lat, lon, tz, lang);

      const formattedWesternPlanets = westernPlanets?.status === 200 ? westernPlanets.response : '';

      const response = {
          westernPlanets: formattedWesternPlanets
      };

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroWesternPlanetsKundali:', error);
      return false;
  }
};


export const generateVedicAstroVarshapalDetailsKundali = async (user_data) => {
  try {
      const customer = user_data; 

      if (!customer.dob || !customer.tob || !customer.lon || !customer.lat) {
          return false;
      }

      let dob = customer.dob;
      let tob = customer.tob;
      const lat = customer.lat;
      const lon = customer.lon;
      const tz = customer.tz || '5.5';
      const div = 'D1';
      const color = '%23ff3366';
      const style = 'north'; // south
      const font_size = '12';
      const font_style = 'Nunito';
      const colorful_planets = '0';
      const size = '400';
      const stroke = '2';
      const lang = 'en';

      dob = formatDate(dob);
      if (!dob) {
          return false;
      }

      tob = formatTime(tob);
      if (!tob) {
          return false;
      }

      const varshapalDetails = await vedicAstro.varshapalDetails(dob, tob, lat, lon, tz, lang);

      const formattedVarshapalDetails = varshapalDetails?.status === 200 ? varshapalDetails.response : '';

      const response = {
          varshapalDetails: formattedVarshapalDetails
      };

      return response;
  } catch (error) {
      console.error('Error in generateVedicAstroVarshapalDetailsKundali:', error);
      return false;
  }
};