export interface WeatherData {
	weather: WeatherResponse;
	air: AirResponse;
	updateTime: string;
	location?: {
		id: string;
		latitude: string;
		longitude: string;
		city: string;
		country: string;
	};
}

export interface CityOption {
	id: string;
	name: string;
	lat: string;
	lon: string;
	adm1: string;
	adm2: string;
	country: string;
}

export interface GeoResponse {
	code: string;
	location: CityOption[];
}

export interface WeatherResponse {
	code: string;
	updateTime: string;
	fxLink: string;
	now: {
		icon: number;
		temp: string;
		text: string;
		windDir: string;
		windSpeed: string;
		humidity: string;
		feelsLike: string;
		windScale: string;
		obsTime: string;
	};
}

export interface AirResponse {
	code: string;
	updateTime: string;
	now: {
		aqi: string;
		category: string;
		pm2p5: string;
		o3?: string;
	};
}
