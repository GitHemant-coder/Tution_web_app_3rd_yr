import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);
