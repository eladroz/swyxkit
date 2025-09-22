import { getContent } from '$lib/content';
import { contentCacheHeaders } from "$lib/cacheHeaders";
import { error } from '@sveltejs/kit';
/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET({ fetch, params }) {
	const { slug } = params;
	let data;
	try {
		data = await getContent(fetch, slug);
		return new Response(JSON.stringify(data), {
			headers: { ...contentCacheHeaders() }
		});
	} catch (err) {
		console.log("didn't find ", slug);
		console.error(err);
		throw error(404, err.message);
	}
}
