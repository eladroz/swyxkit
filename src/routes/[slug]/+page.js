import { error } from '@sveltejs/kit';
import { REPO_URL } from '$lib/siteConfig';
import { contentCacheHeaders } from "$lib/cacheHeaders";

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, setHeaders }) {
	const slug = params.slug;
	let [pageData, listData] = await Promise.all([
		fetch(`/api/blog/${slug}.json`),
		fetch(`/api/listContent.json`)
	])
	if (pageData.status > 400) {
		throw error(pageData.status, await pageData.text());
	}
	if (listData.status > 400) {
		throw error(listData.status, await listData.text());
	}
	setHeaders({ ...contentCacheHeaders() });
	return {
		json: await pageData.json(),
		list: (await listData.json()).slice(0, 10),
		slug,
		REPO_URL
	};
	// } catch (err) {
	// 	console.error('error fetching blog post at [slug].svelte: ' + slug, res, err);
	// 	throw error(500, 'error fetching blog post at [slug].svelte: ' + slug + ': ' + res);
	// }
}
