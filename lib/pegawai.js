const BASE_URL_API = 'http://silka.balangankab.go.id';
const axios = require('axios').default;

const pegawai = async (NIP_NIK) => {
  try {
    const response = await axios.get(`${BASE_URL_API}/api/filternipnik/${NIP_NIK}`);
    return response;
  } catch (error) {
    return error;
  }
}

exports.pegawai = pegawai;