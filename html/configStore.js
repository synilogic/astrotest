
const config = {};

export const setConfig = (key, value) => {
  config[key] = value;
};

export const getConfig = (key) => {
  return config[key];
};

export const getAllConfig = () => config;
