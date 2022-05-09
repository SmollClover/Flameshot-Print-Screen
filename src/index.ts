import dotenv from 'dotenv';
dotenv.config();

import { client } from './client/Client';

new client().start(process.env.TOKEN);
