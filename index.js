import snoowrap from 'snoowrap';
import dotenv from "dotenv";
dotenv.config();

const REFERRAL_URL_REGEX = /https:\/\/wlth\.fr\/\w{7}/;

const config = {
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	username: process.env.REDDIT_USER,
	password: process.env.REDDIT_PASS,
	user_agent: 'wf-invite-bot'
};

async function getComments() {
	const submission = await reddit.getSubmission(process.env.REFERRAL_POST_ID);
	const replies = await submission.expandReplies();
	return replies.comments.map(reply => reply.body);
}

function extractReferralCodes(comments) {
	const uniqueCodes = comments.reduce((codes, comment) => {
		let matches = comment.match(REFERRAL_URL_REGEX);

		if (matches) {
			codes.add(matches[0]);
		}

		return codes;
	}, new Set());

	return [...uniqueCodes];
}

async function getReferralCodes() {
	const replies = await getComments();
	return extractReferralCodes(replies);
}

async function setRandomReferralCode() {
	const referralCodes = await getReferralCodes();

	if (referralCodes.length) {
		const referralCode = referralCodes[Math.floor(Math.random() * referralCodes.length)];

		const subreddit = await reddit.getSubreddit('wealthfront')
		await subreddit.editSettings({
			public_description: `Use this invite code when signing up to get an extra $5k managed for free: ${referralCode}`
		});

		console.log(`Invite code updated to ${referralCode}`);
	} else {
		console.log('No invite codes found');
	}
}

const reddit = new snoowrap(config);
setRandomReferralCode();
