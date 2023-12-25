import { copy } from 'copy-paste';
import imageType from 'image-type';
import type { InferType } from 'yup';

import * as Paths from '~/constant/Paths';
import { Config } from '~/schema/Config';
import { PSResponse } from '~/schema/PSResponse';

export class App {
	private config: InferType<typeof Config> | null = null;

	public async loadConfig() {
		const configFile = Bun.file(Paths.CONFIG);
		if (configFile.size <= 0) throw new Error(`Could not load configuration from ${Paths.CONFIG}`);

		this.config = Config.json().cast(await configFile.json());
	}

	public async launchFlameshot() {
		const flameshot = Bun.spawn(['flameshot', 'gui', '-r']);

		await flameshot.exited;
		if (flameshot.signalCode) throw new Error(`Flameshot exited with signal code ${flameshot.signalCode}`);

		const buffer = new Uint8Array(await Bun.readableStreamToArrayBuffer(flameshot.stdout));
		await this.sendImage(buffer);
	}

	private async sendImage(buffer: Uint8Array) {
		if (!this.config) throw new Error('Config should not be undefined, yet it is');

		const type = await imageType(buffer);
		if (!type) throw new Error('Expected type of image but received unknown type');

		const date = new Date();

		const data = new FormData();
		data.append('auth', this.config.Arguments.auth);
		data.append('secure', this.config.Arguments.secure);
		data.append('url', '');
		data.append(
			this.config.FileFormName,
			new Blob([buffer], { type: type.mime }),
			`Print-Screen-Uploader_${date.toISOString()}.${type.ext}`,
		);

		const request = await fetch(this.config.RequestURL, {
			method: this.config.RequestType,
			body: data,
		});

		if (request.status !== 200)
			throw new Error(`Expected status code 200 but received ${request.status} ${request.statusText}`);

		const response = PSResponse.json().cast(await request.json());
		if (response.status !== 'OK' || response.errormsg)
			throw new Error(`Received unexpected response from Server ${response.status} ${response.errormsg}`);

		console.log(response.url);
		copy(response.url);
	}
}
