import consola from 'consola';
import { copy } from 'copy-paste';
import { ensureFileSync, readJSONSync } from 'fs-extra';
import isPNG from 'is-png';
import { homedir } from 'os';
import request from 'request';

import { Config } from './interface/Config';

if (process.platform !== 'linux') {
	consola.fatal('This Program only supports Linux!');
	process.exit(1);
}

class Client {
	private configLocation = `${homedir()}/.config/print-screen-uploader/config.json`;
	private config: Config;

	public constructor() {
		this.start();
	}

	private async start(): Promise<void> {
		await this.loadConfig();

		process.stdin.on('data', async (data) => {
			if (isPNG(data)) {
				await this.sendPicture(data);
			}
		});
	}

	private async sendPicture(picture: Buffer) {
		const date = new Date();

		const data = {
			auth: this.config.Arguments.auth,
			secure: this.config.Arguments.secure,
			url: '',
		};

		data[this.config.FileFormName] = {
			value: picture,
			options: { contentType: 'image/png', filename: `Print-Screen-Uploader_${date.toISOString()}.png` },
		};

		request(
			this.config.RequestURL,
			{
				method: 'POST',
				formData: data,
				headers: { 'Content-Type': 'multipart/form-data' },
			},
			(err, httpResponse, body) => {
				if (err) return consola.error(err);

				if (httpResponse.statusCode === 200) {
					const response = JSON.parse(body);
					consola.log(response);
					copy(response.url, () => {
						process.exit(0);
					});
				}
			}
		);
	}

	private async loadConfig(): Promise<void> {
		await this.ensureConfig();

		try {
			this.config = readJSONSync(this.configLocation);
		} catch {
			consola.error('Invalid JSON configuration');
			process.exit(2);
		}

		if (!(this.config.RequestURL && this.config.Arguments.auth && this.config.Arguments.secure)) {
			consola.error('Invalid JSON configuration');
			process.exit(3);
		}
	}

	private async ensureConfig(): Promise<void> {
		ensureFileSync(this.configLocation);
	}
}

new Client();
