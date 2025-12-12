import fs from 'fs';
import path from 'path';
import { constants } from '../_config/constants.js'; // Adjust path to your constants

const PUBLIC_DIR = path.resolve('public'); // or wherever your public folder is

export function getPublicImageUrl(imageName = '', type = 'customer') {
  if (!imageName) return null;

  const imagePath =
    type === 'customer' ? constants.customer_image_path : constants.astrologer_image_path;

  const fullPath = path.join(PUBLIC_DIR, imagePath, imageName);
  if (fs.existsSync(fullPath)) {
    return `${constants.base_url}/${imagePath}${imageName}`;
  }
  return null;
}

export function getDefaultCustomerImage() {
  return `${constants.base_url}/${constants.default_customer_image_path}`;
}

export function getDefaultAstrologerImage() {
  return `${constants.base_url}/${constants.default_astrologer_image_path}`;
}
