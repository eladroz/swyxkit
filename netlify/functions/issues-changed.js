import crypto from 'crypto';
import { purgeCache } from '@netlify/functions';
import { ISSUES_CACHE_TAG } from '../../src/lib/cacheHeaders';

export const config = {
	path: '/api/issues-changed'
};

export default async (request) => {
	if (request.method !== 'POST')
		return Response.json({ error: 'Method not allowed' }, { status: 401 });

	const webhookSecret = process.env.GH_WEBHOOK_SECRET;
	const signature = request.headers.get('x-hub-signature-256');
	const body = await request.text();

	const verificationResult = verifyWebhookSignature(body, signature, webhookSecret);
	if (!verificationResult.valid)
		return Response.json({ error: verificationResult.error }, { status: 401 });

	let payload;
	try {
		payload = JSON.parse(body);
	} catch (error) {
		console.error('Failed to parse webhook payload:', error);
		return Response.json({ error: 'Invalid JSON payload' }, { status: 500 });
	}

	const eventType = request.headers.get('x-github-event');
	if (eventType === 'ping') {
		// GitHub sends this event type when you save a new webhook
		console.log(`Got ping event from GitHub, all good! zen: ${payload.zen}`)
		return Response.json({ success: true });
	} else if (eventType !== 'issues') {
		// Webhook might have irrelevant event types configured (e.g. 'push', which is on by default)
		console.warn(`Got unsupported event from GitHub: ${eventType}, check your webhook settings`)
		return Response.json({ error: `Unexpected event type: ${eventType}` }, { status: 500 });
	}

	console.log(`Got action: ${payload.action}, issue URL: ${payload.issue?.html_url}`);

	console.log(`Purging cache tag: ${ISSUES_CACHE_TAG} on Netlify`);
	await purgeCache({ tags: [ISSUES_CACHE_TAG] });

	return Response.json({
		success: true,
		message: 'Webhook processed successfully'
	});
};

const verifyWebhookSignature = (body, signature, secret) => {
	if (!secret) {
		console.error('GH_WEBHOOK_SECRET environment variable not configured');
		return { valid: false, error: 'Invalid configuration' };
	}

	if (!signature) {
		console.error('No signature found in request headers');
		return { valid: false, error: 'No signature provided' };
	}

	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(body, 'utf8');
	const expectedSignature = `sha256=${hmac.digest('hex')}`;

	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
		console.error('Invalid webhook signature');
		return { valid: false, error: 'Invalid signature' };
	}

	console.log('Webhook signature verified successfully');
	return { valid: true };
};
