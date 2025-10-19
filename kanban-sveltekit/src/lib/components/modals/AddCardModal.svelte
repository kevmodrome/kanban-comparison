<script lang="ts">
	import { createCard } from './cards.remote';
	import type { UsersList, TagsList } from '$lib/server/boards';

	let {
		boardId,
		users,
		tags,
	}: {
		boardId: string;
		users: UsersList;
		tags: TagsList;
	} = $props();

	let dialog: HTMLDialogElement;

	function close() {
		dialog.close();
	}

	const { title, description, tagIds, assigneeId } = createCard.fields;
</script>

<div class="flex justify-start mb-4">
	<button type="button" class="btn btn-primary" onclick={() => dialog.showModal()}>
		Add Card
	</button>
</div>

<dialog
	bind:this={dialog}
	class="modal !mt-0"
	onclick={(e) => {
		if (e.target === e.currentTarget) close();
	}}
>
	<div class="modal-box bg-base-200 dark:bg-base-300">
		<form
			{...createCard.enhance(async ({ form, submit }) => {
				await submit();
				close();
				form.reset();
			})}
		>
			<button
				type="button"
				class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
				onclick={close}
				disabled={!!createCard.pending}
			>
				✕
			</button>
			<h3 class="font-bold text-lg mb-4">Add New Card</h3>
			{#if createCard.fields.issues()}
				<div class="alert alert-error mb-4">
					{#each createCard.fields.issues() as issue}
						<span>{issue}</span>
					{/each}
				</div>
			{/if}

			<input type="hidden" name="boardId" value={boardId} />

			<div class="form-control w-full mb-4">
				<label class="label" for="add-card-title">
					<span class="label-text">Title</span>
				</label>
				<input
					{...title.as('text')}
					id="add-card-title"
					class="input input-bordered w-full"
					placeholder="Enter card title"
					required
					disabled={!!createCard.pending}
				/>
				{#each title.issues() as issue}
					<div class="validator-hint">{issue.message}</div>
				{/each}
			</div>

			<div class="form-control w-full mb-4">
				<label class="label" for="add-card-description">
					<span class="label-text">Description</span>
				</label>
				<textarea
					{...description.as('text')}
					id="add-card-description"
					class="textarea textarea-bordered h-24 w-full"
					placeholder="Enter card description (optional)"
					disabled={!!createCard.pending}
				></textarea>
				{#each description.issues() as issue}
					<div class="validator-hint">{issue.message}</div>
				{/each}
			</div>

			<div class="form-control w-full mb-4">
				<label class="label" for="add-card-assignee">
					<span class="label-text">Assignee</span>
				</label>
				<select
					{...assigneeId.as('select')}
					name="assigneeId"
					id="add-card-assignee"
					class="select select-bordered w-full"
					disabled={!!createCard.pending}
				>
					<option value="">Unassigned</option>
					{#each users as user (user.id)}
						<option value={user.id}>{user.name}</option>
					{/each}
				</select>
				{#each assigneeId.issues() as issue}
					<div class="validator-hint">{issue.message}</div>
				{/each}
			</div>

			<div class="form-control w-full mb-4">
				<div class="label">
					<span class="label-text">Tags</span>
				</div>
				<div class="flex flex-wrap gap-2 p-4 border border-base-300 rounded-lg">
					{#each tags as tag}
						<label
							class={[
								'badge border-2 font-semibold cursor-pointer transition-all hover:scale-105 focus-within:ring-2',
								{
									'badge-outline': !tagIds?.value()?.includes(tag.id),
									'text-white bg-primary border-primary': tagIds
										?.value()
										?.includes(tag.id),
								},
							]}
							style={tagIds?.value()?.includes(tag.id)
								? `background-color: ${tag.color}; border-color: ${tag.color};`
								: `color: ${tag.color}; border-color: ${tag.color};`}
						>
							<input class="sr-only" {...tagIds.as('checkbox', tag.id)} />
							{tag.name}
						</label>
					{/each}
					{#each tagIds.issues() as issue}
						<div class="validator-hint">{issue.message}</div>
					{/each}
				</div>
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={close}
					disabled={!!createCard.pending}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="btn btn-primary"
					disabled={!!createCard.pending}
				>
					{!!createCard.pending ? 'Adding...' : 'Add Card'}
				</button>
			</div>
		</form>
	</div>
</dialog>
