
import SettingModel from './_models/settings.js';
import { setConfig } from './configStore.js';

export const loadAppConfig = async () => {
  const settings = await SettingModel.findAll();
  settings.forEach((setting) => {
    setConfig(setting.setting_name, setting.setting_value);
  });

  const now = new Date();
  setConfig('current_time', now.toTimeString().split(' ')[0]);
  setConfig('current_date', now.toISOString().split('T')[0]);
  setConfig('current_datetime', now.toISOString().slice(0, 19).replace('T', ' '));
};
