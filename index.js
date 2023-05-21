import snoowrap from 'snoowrap';
import dotenv from "dotenv";
dotenv.config();

const REFERRAL_URL_REGEX = /(https:\/\/www.wealthfront.com\/(c\/affiliates\/)?invited\/[\d\w]{4}-[\d\w]{4}-[\d\w]{4}-[\d\w]{4}|https:\/\/wlth\.fr\/\w{7})/;
const DUPE_COMMENT_ALLOWLIST = ['AutoModerator', 'wf-invite-bot', '[deleted]'];

const postsToUpdate = [
	process.env.INVESTMENT_REFERRAL_POST_ID,
	process.env.CASH_REFERRAL_POST_ID,
];

const config = {
	client_id: process.env.CLIENT_ID,
	client_secret: process.env.CLIENT_SECRET,
	username: process.env.REDDIT_USER,
	password: process.env.REDDIT_PASS,
	user_agent: 'wf-invite-bot',
};

async function getComments(submission) {
	const replies = await submission.expandReplies();
	return replies.comments;
}

function extractReferralCodes(comments) {
	const uniqueCodes = comments.reduce((codes, { body }) => {
		let matches = body.match(REFERRAL_URL_REGEX);

		if (matches) {
			codes.add(matches[0]);
		}

		return codes;
	}, new Set());

	return [...uniqueCodes];
}

function removeDupeUserComments(comments) {
	const promises = [];
	const usersWithComments = new Set();

	comments.forEach(async comment => {
		if (!comment.removed && !DUPE_COMMENT_ALLOWLIST.includes(comment.author.name)) {
			if (!usersWithComments.has(comment.author.name)) {
				usersWithComments.add(comment.author.name);
			} else {
				console.log(`Removing comment from ${comment.author.name}`);
				promises.push(comment.delete());
			}
		}
	});

	return Promise.all(promises);
}

async function updatePostReferralCode(postId) {
	const submission = await reddit.getSubmission(postId);
	const comments = await getComments(submission);
	const referralCodes = extractReferralCodes(comments);

	if (referralCodes.length) {
		const referralCode = referralCodes[Math.floor(Math.random() * referralCodes.length)];

		await submission.edit(`Learn more and redeem at: ${referralCode}\n\n(Post your own referral codes below)\n\n# Important: only one post per user/referral code. Duplicates will be deleted. Repeated posting will result in a ban`)

		console.log(`Invite code updated to ${referralCode}`);
	} else {
		console.log('No invite codes found');
	}

	await removeDupeUserComments(comments);
}

const reddit = new snoowrap(config);
reddit.config({
	requestDelay: 5000,
	continueAfterRatelimitError: true,
});
postsToUpdate.map(updatePostReferralCode)
