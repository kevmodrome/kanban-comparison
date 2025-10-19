import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getBoard, getUsers, getTags } from '$lib/server/boards';
import { db } from '$lib/db';
import { cards, cardTags, comments, lists } from '$lib/db/schema';
import { eq, max } from 'drizzle-orm';
import * as v from 'valibot';
import { CardUpdateSchema, CommentSchema } from '$lib/validation';

export const actions = {
	updateCard: async ({ request }) => {
		try {
			const formData = await request.formData();
			const cardId = formData.get('cardId') as string;
			const title = formData.get('title') as string;
			const description = formData.get('description') as string;
			const assigneeId = formData.get('assigneeId') as string;
			const tagIds = formData.getAll('tagIds') as string[];

			// Validate with Valibot
			const result = v.safeParse(CardUpdateSchema, {
				cardId,
				title,
				description: description || undefined,
				assigneeId: assigneeId || undefined,
				tagIds,
			});

			if (!result.success) {
				const firstIssue = result.issues[0];
				return fail(400, { error: firstIssue.message });
			}

			db.transaction((tx) => {
				tx.update(cards)
					.set({
						title: result.output.title,
						description: result.output.description || null,
						assigneeId: result.output.assigneeId || null,
					})
					.where(eq(cards.id, result.output.cardId))
					.run();

				tx.delete(cardTags)
					.where(eq(cardTags.cardId, result.output.cardId))
					.run();

				if (result.output.tagIds && result.output.tagIds.length > 0) {
					tx.insert(cardTags)
						.values(
							result.output.tagIds.map((tagId) => ({
								cardId: result.output.cardId,
								tagId,
							})),
						)
						.run();
				}
			});

			return { success: true };
		} catch (err) {
			console.error('Failed to update card:', err);
			return fail(500, { error: 'Failed to update card. Please try again.' });
		}
	},

	addComment: async ({ request }) => {
		try {
			const formData = await request.formData();
			const cardId = formData.get('cardId') as string;
			const userId = formData.get('userId') as string;
			const text = formData.get('text') as string;

			// Validate with Valibot
			const result = v.safeParse(CommentSchema, {
				cardId,
				userId,
				text,
			});

			if (!result.success) {
				const firstIssue = result.issues[0];
				return fail(400, { error: firstIssue.message });
			}

			const commentId = crypto.randomUUID();

			await db.insert(comments).values({
				id: commentId,
				cardId: result.output.cardId,
				userId: result.output.userId,
				text: result.output.text,
			});

			return { success: true };
		} catch (err) {
			console.error('Failed to add comment:', err);
			return fail(500, { error: 'Failed to add comment. Please try again.' });
		}
	},

	updateCardList: async ({ request }) => {
		try {
			const formData = await request.formData();
			const cardId = formData.get('cardId') as string;
			const newListId = formData.get('newListId') as string;

			if (!cardId || !newListId) {
				return fail(400, { error: 'Card ID and new list ID are required' });
			}

			await db.update(cards).set({ listId: newListId }).where(eq(cards.id, cardId));

			return { success: true };
		} catch (err) {
			console.error('Failed to update card list:', err);
			return fail(500, { error: 'Failed to move card. Please try again.' });
		}
	},

	updateCardPositions: async ({ request }) => {
		try {
			const formData = await request.formData();
			const cardIds = formData.getAll('cardIds') as string[];

			if (cardIds.length === 0) {
				return fail(400, { error: 'Card IDs are required' });
			}

			db.transaction((tx) => {
				cardIds.forEach((cardId, index) => {
					tx.update(cards)
						.set({ position: index })
						.where(eq(cards.id, cardId))
						.run();
				});
			});

			return { success: true };
		} catch (err) {
			console.error('Failed to update card positions:', err);
			return fail(500, { error: 'Failed to reorder cards. Please try again.' });
		}
	},

	deleteCard: async ({ request }) => {
		try {
			const formData = await request.formData();
			const cardId = formData.get('cardId') as string;

			if (!cardId) {
				return fail(400, { error: 'Card ID is required' });
			}

			await db.delete(cards).where(eq(cards.id, cardId));

			return { success: true };
		} catch (err) {
			console.error('Failed to delete card:', err);
			return fail(500, { error: 'Failed to delete card. Please try again.' });
		}
	},
} satisfies Actions;
