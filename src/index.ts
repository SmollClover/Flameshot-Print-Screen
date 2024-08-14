#!/usr/bin/env bun

import { App } from './class/App';

const app = new App();

await app.loadConfig();
await app.launchFlameshot();
