import moment from "moment-timezone";

export const formatDateTime = (date, timezone = 'Asia/Kolkata', format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).tz(timezone).format(format);
};
export const formatDateTime_crr = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment.utc(date).format(format);
};

// export const formatDateTime_crr = (date, timezone = 'Asia/Kolkata', format = 'YYYY-MM-DD HH:mm:ss') => {
//   return moment(date).tz(timezone, true).format(format);
// };
export async function dobFormatForApp(date) {
  if (!date || date === '0000-00-00') {
    return '';
  }

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}
export async function tobFormatForApp(time) {
  if (!time) return '';

  const date = new Date(`1970-01-01T${time}Z`); // Use a base date
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');

  return `${displayHours}:${minutes} ${ampm}`;
}
export async function getUserAssets(user) {
 return user;
}
