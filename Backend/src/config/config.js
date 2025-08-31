// api/config.js
import axios from 'axios';
import 'dotenv/config';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

export default API;
