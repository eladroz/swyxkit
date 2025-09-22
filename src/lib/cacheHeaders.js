const SHORT_CACHE = 60 * 60; // 1 hour
const LONG_CACHE = 24 * SHORT_CACHE; // 24 hours
export const ISSUES_CACHE_TAG = 'issues';

/**
 * @param {'short' | 'long'} contentLifetime
 * @returns {Record<string, string>}
 */
export function contentCacheHeaders(contentLifetime = 'short') {
	const isProductionSSR = import.meta.env.PROD && import.meta.env.SSR;
	if (!isProductionSSR) return {};

	const useNetlifyCache = process.env?.USE_NETLIFY_CACHE;
	console.log('useNetlifyCache:', useNetlifyCache);
	if (useNetlifyCache) {
		return {
			'netlify-cdn-cache-control': `durable, s-maxage=${LONG_CACHE}, stale-while-revalidate=${SHORT_CACHE}`,
			'cache-control': 'public, max-age=0, must-revalidate',
			'cache-tag': ISSUES_CACHE_TAG
		};
	} else {
		const maxAge = contentLifetime === 'short' ? SHORT_CACHE : LONG_CACHE;
		return { 'cache-control': `public, max-age=${maxAge}` };
	}
}
