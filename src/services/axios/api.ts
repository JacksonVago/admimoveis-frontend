import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:98'
  //baseURL: 'http://20.51.104.223:98'
});

export default api
