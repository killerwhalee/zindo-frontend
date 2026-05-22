import axios from 'axios';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	withCredentials: false,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Silently refresh the access token on 401, then replay the original request
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
	failedQueue.forEach((p) =>
		error ? p.reject(error) : p.resolve(token!),
	);
	failedQueue = [];
}

api.interceptors.response.use(
	(res) => res,
	async (error) => {
		const original = error.config;

		if (error.response?.status !== 401 || original._retry) {
			return Promise.reject(error);
		}

		if (isRefreshing) {
			return new Promise<string>((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			}).then((token) => {
				original.headers.Authorization = `Bearer ${token}`;
				return api(original);
			});
		}

		original._retry = true;
		isRefreshing = true;

		const refresh = getRefreshToken();
		if (!refresh) {
			clearTokens();
			isRefreshing = false;
			return Promise.reject(error);
		}

		try {
			const base = import.meta.env.VITE_API_BASE_URL ?? '';
			const { data } = await axios.post(
				`${base}/user/auth/token/refresh/`,
				{ refresh },
			);
			setTokens(data.access, data.refresh);
			processQueue(null, data.access);
			original.headers.Authorization = `Bearer ${data.access}`;
			return api(original);
		} catch (err) {
			processQueue(err, null);
			clearTokens();
			return Promise.reject(err);
		} finally {
			isRefreshing = false;
		}
	},
);

export default api;
