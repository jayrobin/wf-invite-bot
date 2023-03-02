import snoowrap from 'snoowrap';
import dotenv from "dotenv";
dotenv.config();

const REFERRAL_URL_REGEX = /(https:\/\/www.wealthfront.com\/(c\/affiliates\/)?invited\/[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}|https:\/\/wlth\.fr\/\w{7})/;

const postsToUpdate = [
	process.env.INVESTMENT_REFERRAL_POST_ID,
	process.env.CASH_REFERRAL_POST_ID,
];

const config = {
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	username: process.env.REDDIT_USER,
	password: process.env.REDDIT_PASS,
	user_agent: 'wf-invite-bot'
};

async function getComments(submission) {
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

async function getReferralCodes(submission) {
	const replies = await getComments(submission);
	return extractReferralCodes(replies);
}

async function updatePostReferralCode(postId) {
	const submission = await reddit.getSubmission(postId);
	const referralCodes = await getReferralCodes(submission);

	if (referralCodes.length) {
		const referralCode = referralCodes[Math.floor(Math.random() * referralCodes.length)];

		await submission.edit(`Learn more and redeem at: ${referralCode}\n\n(Post your own referral codes below)`)

		console.log(`Invite code updated to ${referralCode}`);
	} else {
		console.log('No invite codes found');
	}
}

const reddit = new snoowrap(config);
postsToUpdate.map(updatePostReferralCode)
