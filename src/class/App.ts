import { unlink } from 'node:fs/promises';
import { $, file, spawn } from 'bun';
import imageType from 'image-type';
import type { InferType } from 'yup';

import * as Paths from '~/constant/Paths';
import { Config } from '~/schema/Config';
import { PSResponse } from '~/schema/PSResponse';

export class App {
	private config: InferType<typeof Config> | null = null;

	public async loadConfig() {
		const configFile = file(Paths.CONFIG);
		if (configFile.size <= 0) throw new Error(`Could not load configuration from ${Paths.CONFIG}`);

		this.config = Config.json().cast(await configFile.json());
	}

	public async launchFlameshot() {
		const old = file(Paths.PICTURE);
		if (await old.exists()) await unlink(Paths.PICTURE);

		await $`flameshot gui --path ${Paths.PICTURE}`;

		await this.sendImage();
	}

	private async copyToClipboard(input: string) {
		await spawn(['wl-copy', input], { stdout: null }).exited;
	}

	private async sendImage() {
		if (!this.config) throw new Error('Config should not be undefined, yet it is');

		const picture = file(Paths.PICTURE);
		const buffer = new Uint8Array(await picture.arrayBuffer());
		await unlink(Paths.PICTURE);

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
		this.copyToClipboard(response.url);
	}
}
