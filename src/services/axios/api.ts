import axios from 'axios'

const api = axios.create({
  //baseURL: 'http://localhost:98'
  baseURL: 'https://www.adminimove.com.br:98'
});

export default api
