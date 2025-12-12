// path.js (ESM)
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
    rootPath: __dirname,
    base_verification: 'localhost',
    public_path: path.join(__dirname, 'public', 'uploads'),
    public_path_customers: path.join(__dirname, 'public', 'uploads', 'customers'),
    public_path_csv: path.join(__dirname, 'public', 'csv'),
    public_path_pdf: path.join(__dirname, 'public', 'pdf'),
};
