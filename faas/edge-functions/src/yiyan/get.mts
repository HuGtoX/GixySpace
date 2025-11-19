import { DailySentence } from '@gixy/types/yiyan.ts';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { dailySentences } from '../../common/schema.ts';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getEnv } from '../../utils/getEnv.mts';

/**
 * https://developer.hitokoto.cn/sentence/
 * 每日一言
 * @param _
 * @returns DayliSentence
 */
async function getDailySentence(_: Request) {
	const queryClient = postgres(getEnv('DATABASE_URL')!);
	const db = drizzle({ client: queryClient, schema: { dailySentences } });

	// 获取今天的日期
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// 检查今天是否已有数据
	const existingSentence = await db.query.dailySentences.findFirst({
		where: eq(dailySentences.fetchDate, sql`CURRENT_DATE`)
	});

	if (existingSentence) {
		return {
			result: JSON.parse(existingSentence.fetchData ?? '{}')
		};
	}

	// 尝试获取唯一内容，最多重试10次
	const maxRetries = 10;
	let result: DailySentence | null = null;

	for (let i = 0; i < maxRetries; i++) {
		try {
			const data = await fetch(
				'https://international.v1.hitokoto.cn?c=k'
			);

			if (!data.ok) {
				throw new Error(`每日一言获取失败: HTTP ${data.status}`);
			}

			const fetchedResult: DailySentence = await data.json();

			// 检查内容是否已存在于数据库中
			const duplicateCheck = await db.query.dailySentences.findFirst({
				where: eq(dailySentences.content, fetchedResult.hitokoto)
			});

			if (!duplicateCheck) {
				// 找到唯一内容，跳出循环
				result = fetchedResult;
				break;
			}

			// 如果内容重复，继续下一次尝试
			console.log(`第 ${i + 1} 次尝试获取到重复内容，继续重试...`);
		} catch (error) {
			console.error(`第 ${i + 1} 次获取失败:`, error);
			// 如果不是最后一次尝试，继续重试
			if (i === maxRetries - 1) {
				throw new Error(
					`每日一言获取失败: ${error instanceof Error ? error.message : String(error)}`
				);
			}
		}
	}

	if (!result) {
		throw new Error('无法获取到唯一的每日一言内容，已达到最大重试次数');
	}

	// 保存到数据库
	await db.insert(dailySentences).values({
		content: result.hitokoto,
		fetchData: JSON.stringify(result),
		source: result.from
	});

	return {
		result
	};
}

export default getDailySentence;
