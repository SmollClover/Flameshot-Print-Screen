import { object, string } from 'yup';

export const PSResponse = object({ status: string().required(), errormsg: string().required(), url: string().required() });
