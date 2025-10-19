import { form, query } from '$app/server';
import { CardSchema, CardUpdateSchema, CommentSchema } from '$lib/validation';
import { db } from '$lib/db';
import { cards, cardTags, comments, lists } from '$lib/db/schema';
import { eq, max } from 'drizzle-orm';
import { getBoards as getBoardsFromServer } from '$lib/server/boards';
import * as v from 'valibot';

const CardSchemaWithBoardId = v.object({
	...CardSchema.entries,
	boardId: v.string(),
});

export const getBoards = query(async () => {
	return await getBoardsFromServer();
});

export const createCard = form(CardSchemaWithBoardId, async (data, invalid) => {
	console.log(data);
	try {
		const todoLists = await db
			.select()
			.from(lists)
			.where(eq(lists.boardId, data.boardId));

		const todoList = todoLists.find((list) => list.title === 'Todo');

		if (!todoList) {
			return invalid('Todo list not found for this board');
		}

		// Get the highest position in the Todo list
		const maxPositionResult = await db
			.select({ maxPos: max(cards.position) })
			.from(cards)
			.where(eq(cards.listId, todoList.id));

		const nextPosition = (maxPositionResult[0]?.maxPos ?? -1) + 1;

		// Create the card
		const cardId = crypto.randomUUID();

		db.transaction((tx) => {
			tx.insert(cards)
				.values({
					id: cardId,
					listId: todoList.id,
					title: data.title,
					description: data.description || null,
					assigneeId: data.assigneeId || null,
					position: nextPosition,
					completed: false,
				})
				.run();

			if (data.tagIds && data.tagIds.length > 0) {
				tx.insert(cardTags)
					.values(
						data.tagIds.map((tagId) => ({
							cardId,
							tagId,
						})),
					)
					.run();
			}
		});

		return { success: true, cardId };
	} catch (err) {
		console.error('Failed to create card:', err);
		return invalid('Failed to create card. Please try again.');
	}
});
