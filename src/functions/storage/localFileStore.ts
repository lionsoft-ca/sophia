import fs from 'fs';
import path from 'path';
import { agentContext } from '#agent/agentContext';
import { func, funcClass } from '#functionSchema/functionDecorators';
import { FileMetadata, FileStore } from '#functions/storage/filestore';
import { ToolType } from '#functions/toolType';

/**
 * FileStore implementation that stores files on the local file system.
 * Uses the native filesystem, and not FileSystem.read/writeFile, to store the agents files in a known place.
 */
@funcClass(__filename)
export class LocalFileStore implements FileStore {
	private basePath: string;

	constructor() {
		this.basePath = path.join(process.cwd(), '.nous', 'filestore');
	}

	getToolType(): ToolType {
		return 'filestore';
	}

	/**
	 * Saves the contents to a file with the given filename and updates metadata.
	 * @param {string} filename - The name of the file to save.
	 * @param {string} contents - The contents to save to the file.
	 * @param {string} description - A description of the contents which can be used to identify it later.
	 * @returns {Promise<void>}
	 */
	@func()
	async saveFile(filename: string, contents: string, description: string): Promise<void> {
		const agentId = agentContext().agentId;
		const fullPath = path.join(this.basePath, agentId, filename);
		await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
		await fs.promises.writeFile(fullPath, contents, 'utf8');

		// Update metadata
		const metadataPath = path.join(this.basePath, agentId, '.metadata.json');
		let metadata: Record<string, FileMetadata> = {};
		try {
			const metadataContent = await fs.promises.readFile(metadataPath, 'utf8');
			metadata = JSON.parse(metadataContent);
		} catch (error) {
			// If file doesn't exist or is invalid, start with an empty object
		}

		const stats = await fs.promises.stat(fullPath);
		metadata[filename] = {
			filename,
			description,
			sizeKb: (stats.size / 1024).toFixed(2),
			lastUpdated: stats.mtime.toISOString(),
		};

		await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
	}

	/**
	 * Retrieves the contents of a file.
	 * @param {string} filename - The name of the file to read.
	 * @returns {Promise<string>}
	 */
	@func()
	async getFile(filename: string): Promise<string> {
		const agentId = agentContext().agentId;
		const fullPath = path.join(this.basePath, agentId, filename);
		return await fs.promises.readFile(fullPath, 'utf8');
	}

	/**
	 * Lists all files in the current directory with their metadata.
	 * @returns {Promise<FileMetadata[]>}
	 */
	@func()
	async listFiles(): Promise<FileMetadata[]> {
		const agentId = agentContext().agentId;
		const dirPath = path.join(this.basePath, agentId);
		await fs.promises.mkdir(dirPath, { recursive: true });
		const files = await fs.promises.readdir(dirPath);
		const metadataPath = path.join(dirPath, '.metadata.json');

		let metadata: Record<string, FileMetadata> = {};
		try {
			const metadataContent = await fs.promises.readFile(metadataPath, 'utf8');
			metadata = JSON.parse(metadataContent);
		} catch (error) {
			// If file doesn't exist or is invalid, continue with an empty object
		}

		const fileMetadata: FileMetadata[] = [];
		for (const file of files) {
			if (file === '.metadata.json') continue;
			const fullPath = path.join(dirPath, file);
			const stats = await fs.promises.stat(fullPath);
			if (stats.isFile()) {
				fileMetadata.push({
					filename: file,
					description: metadata[file]?.description || '',
					sizeKb: (stats.size / 1024).toFixed(0), // TODO rename to size and convert to readable format 20k, 1.54m 4.23g
					lastUpdated: stats.mtime.toISOString(),
				});
			}
		}

		return fileMetadata;
	}
}
