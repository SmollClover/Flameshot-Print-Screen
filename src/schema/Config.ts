import { object, string } from 'yup';

export const Config = object({
	Name: string().required(),
	DestinationType: string().required(),
	RequestType: string().required(),
	RequestURL: string().url().required(),
	FileFormName: string().required(),
	Arguments: object({
		auth: string().required(),
		secure: string().required(),
		url: string().required(),
	}).required(),
	ResponseType: string().required(),
	URL: string().required(),
});
