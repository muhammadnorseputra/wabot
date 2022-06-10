const { MessageMedia } = require('whatsapp-web.js');
exports.sendMediaFromUrl = async (url) => {
	const response = await MessageMedia.fromUrl(url, (err, data) => {
		return data || err;
	});
	return response
}
