import { randomUUID } from 'crypto';
import { Chat, ChatList, ChatPreview, ChatService } from '#chat/chatTypes';
import { logger } from '#o11y/logger';
import { span } from '#o11y/trace';
import { currentUser } from '#user/userService/userContext';
import { SINGLE_USER_ID } from './inMemoryUserService';

/**
 * In-memory implementation of ChatService
 * Used for testing and local development
 */
export class InMemoryChatService implements ChatService {
	private chats: Map<string, Chat> = new Map();

	/**
	 * Load a chat by its ID
	 * @param chatId The ID of the chat to load
	 * @returns The chat object
	 */
	@span()
	async loadChat(chatId: string): Promise<Chat> {
		const chat = this.chats.get(chatId);
		if (!chat) {
			logger.warn(`Chat with id ${chatId} not found`);
			throw new Error(`Chat with id ${chatId} not found`);
		}

		if (chat.visibility !== 'private' && chat.userId !== currentUser().id) {
			throw new Error('Chat not visible.');
		}

		return structuredClone(chat);
	}

	/**
	 * Save a chat to the in-memory store
	 * @param chat The chat to save
	 * @returns The saved chat
	 */
	@span()
	async saveChat(chat: Chat): Promise<Chat> {
		if (!chat.title) throw new Error('chat title is required');
		if (!chat.userId) chat.userId = SINGLE_USER_ID;
		if (chat.userId !== currentUser().id) throw new Error('chat userId is invalid');

		if (!chat.id) chat.id = randomUUID();
		if (!chat.visibility) chat.visibility = 'private';
		chat.updatedAt = Date.now();

		// Store a clone to prevent changes to the persisted object
		this.chats.set(chat.id, structuredClone(chat));

		return { ...chat };
	}

	/**
	 * List chats with pagination support
	 * @param startAfterId Optional ID to start listing after (for pagination)
	 * @param limit Maximum number of chats to return
	 * @returns Object containing chat previews and hasMore flag
	 */
	@span()
	async listChats(startAfterId?: string, limit = 100): Promise<ChatList> {
		const userId = currentUser().id;

		// Get all chats for the current user
		const userChats = Array.from(this.chats.values())
			.filter((chat) => chat.userId === userId)
			.sort((a, b) => b.updatedAt - a.updatedAt); // Sort by updatedAt desc

		// Find the starting index if startAfterId is provided
		let startIndex = 0;
		if (startAfterId) {
			const startAfterIndex = userChats.findIndex((chat) => chat.id === startAfterId);
			if (startAfterIndex !== -1) {
				startIndex = startAfterIndex + 1;
			}
		}

		// Get the slice of chats based on startIndex and limit
		const chatSlice = userChats.slice(startIndex, startIndex + limit + 1);
		const hasMore = chatSlice.length > limit;

		// Convert to chat previews and respect the limit
		const chats: ChatPreview[] = chatSlice.slice(0, limit).map((chat) => structuredClone({ ...chat, messages: undefined }));

		return { chats, hasMore };
	}

	/**
	 * Delete a chat by its ID
	 * @param chatId The ID of the chat to delete
	 */
	@span()
	async deleteChat(chatId: string): Promise<void> {
		const userId = currentUser().id;
		const chat = this.chats.get(chatId);

		if (!chat) {
			logger.warn(`Chat with id ${chatId} not found`);
			throw new Error(`Chat with id ${chatId} not found`);
		}

		if (chat.userId !== userId) {
			logger.warn(`User ${userId} is not authorized to delete chat ${chatId}`);
			throw new Error('Not authorized to delete this chat');
		}

		this.chats.delete(chatId);
		logger.info(`Chat ${chatId} deleted successfully`);
	}

	/**
	 * Clear all chats from memory
	 * Useful for testing
	 */
	clear(): void {
		this.chats.clear();
	}
}
