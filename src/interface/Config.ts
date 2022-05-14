export interface Config {
	Name: string;
	DestinationType: string;
	RequestType: string;
	RequestURL: string;
	FileFormName: string;
	Arguments: {
		auth: string;
		secure: string;
		url: string;
	};
	ResponseType: string;
	URL: string;
}
