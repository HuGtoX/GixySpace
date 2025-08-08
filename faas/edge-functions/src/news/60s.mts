import { SixtySecondsData } from '@gixy/types';

export default async () => {
	const res: SixtySecondsData = await fetch(
		'https://60s.viki.moe/v2/60s'
	).then((res) => res.json());

	return {
		result: res
	};
};
