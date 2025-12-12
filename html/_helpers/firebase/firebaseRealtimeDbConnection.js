import admin from "firebase-admin";
import { getConfig } from "../../configStore.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const firebaseRealtimeDbConnection = async () => {
  const databaseURL = getConfig("data_base_URL");
  // const databaseURL ="https://synilogicastro-default-rtdb.firebaseio.com";

  // const serviceAccount = JSON.parse(
  //   readFileSync(join(__dirname, "service-account.json"), "utf8")
  // );



  
    const serviceAccount = {
  "type": "service_account",
  "project_id": "synilogicastronode",
  "private_key_id": "8f010c2c5fe033679731a44d95e5062b98efcab2",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCVZyDTBV4otplq\nsk8S/JLmvB7Giy+waYX3fuY6cNCNPnnnYrxEXIi6AZvkKZea6rce/nw5BbEtHxt0\nmCnA3e7k7fFNh64J1JdbCKYscPlqM1p9QL/wnbLgBIBRBFxPAEFo1XoaONdoCj4V\n6aTEVs/gPr8m+rZaMnIEyyDqpnXoOBDlZXPsYGq82At4NqpPDXuJkTL8110YGOsR\nGkr66CJApi+D4GIdF5xeLPe0iZe5fCR86aI6XJ4tF3Oj40UPqSKo/3w5efp0QZey\nh36Kt81AQL+4xwneuUszrJ+G3yaZqcfFgrmsZWNvovxm9I7an6eUnbmwX5bE4KGN\n/utGmtV1AgMBAAECggEAARk8IdqywAx9R7Sq8mIYETx5FdwOv2nVoD9dh9JHixpW\nZ1ZDBlYPc7d9gxAWB/+wCNLPOaFQlbSnJrrUGvgNM/K9KP6vHKExdOwB3ABl3Rsm\nkBadsrIkj0aJMpwcTHQDulBQVwjSKkPIN0oIbTpdyfGikmTnWikJZjHS+qOIHDgc\n10l+yrb/XXdftCg0T7NfU75gAUMlKG2VxM5gJba/GSUWUDtLtzbnu23QfeaPFi+k\nq/9bjn5Ce2t01tvA4NexfNocW13dZAYWLOfssmhAoqmTFPADKR5DCklpyhbx+kAI\nzdLTxIXb8VKSyrjlKgwl+Z8wFPBfA/GE2cyL6cec0QKBgQDNl9o7XYfAh5cs1j37\n2O/qm4GuO+Yk1gEXRSra9h50zRFp4CTAPwVuUaNce/c7yAlIKverqdmM980c726U\nX6p95bny84P6LMpmf8UfsoeHwo3keNGFthV3aaUi+Z6fZEd3o1kd9QrKh0hCepDF\nrEx1RORH8DFcpcFueeEyvx9XTQKBgQC6CHbwaVjciObJ85Bq8HdvgctxL0CTKnvO\nfS7xwDWQZdR9Hduj7w8uIxcP3whMkRFLwCjqsOiLnVaGj5egKxiNNIfh12Z8OKgD\nQDMK/9hiHc5nYc0yYtnSiqAD9f4JGMwolEEX5CzuBT6rbFEll6lMCfC+VwWctdBQ\nmv84wRtyyQKBgQDJ2cVRc8rMpFMwmkfQ9HTZCkSQJA8ZK2N2zVn+EJZmZtAp+v8a\nIMXcQhr5ulxKPWOfj1ALIn+Nf93KAum2kxZ49QtUFPIGteMiL2ACdu3JxKI7JsPP\nW65Hx1lytVGffH0OYTolx2gI4Dl5y4xIB5opqLHYT2Kna7Y2GUOY5zyGIQKBgA4V\nD/PY9aoUDuxgrKD7vP7K43yY6Bl70M1run8AXs2kd7ZU6Uh6kzqZ22gPKRCqtpV2\nYWKKq7/N1DvxaLfuKzidLmARLyfeHhHI7VQ608VxnitDQwY6Z2TBq6VBHM7Rerrj\nph3J3wDRktHlLCtdVKp14ix2Z+1Z8f/4C7PfIlXJAoGBAImTPwbf2qXjrkle3BdS\nGxiSMXCLyA7u8CMGhI7Os30ALSbG2FYbIoPPKpkiW8hNUXWA4jJlAV463FMAuLvJ\nU0SC3nUiqhbJo+WydMH9dRTsO99cBlNPOekXYwbIMzQEEVVt6Om5nbfP2t85Lpqu\nlvFYqPDn+Fb3RYjfO1SxPSER\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@synilogicastronode.iam.gserviceaccount.com",
  "client_id": "109769638802472211352",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40synilogicastronode.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
  //   const serviceAccount = {
  //   type: getConfig("firebase_function_type"),
  //   project_id: getConfig("project_id"),
  //   private_key_id: getConfig("private_key_id"),
  //   private_key: getConfig("private_key")?.replace(/\\n/g, "\n"),
  //   client_email: getConfig("client_email"),
  //   client_id: getConfig("client_id"),
  //   auth_uri: getConfig("auth_uri"),
  //   token_uri: getConfig("token_uri"),
  //   auth_provider_x509_cert_url: getConfig("auth_provider_x509_cert_url"),
  //   client_x509_cert_url: getConfig("client_x509_cert_url"),
  //   universe_domain: getConfig("universe_domain"),
  // };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
    });
  } else if (!admin.app().options.databaseURL) {
    // patch missing URL
    admin.app().options.databaseURL = databaseURL;
 }
  // Ensure exactly one App with databaseURL set:
  if (!admin.apps.length) {
    // first-ever init: give it the URL
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
    });
  } else {
    const defaultApp = admin.app(); // the already-initialized app
    if (!defaultApp.options.databaseURL) {
      // if it was init’d without URL, delete & re-init correctly
      await defaultApp.delete();
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL,
      });
    }
 }

  try {
    const db = admin.database();
    console.log("✅ Firebase Realtime Database initialized");
    return db;
  } catch (error) {
    console.error("Error getting database instance:", error.stack || error);
    return false;
  }
};
