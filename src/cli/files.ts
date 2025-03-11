import '#fastify/trace-init/trace-init'; // leave an empty line next so this doesn't get sorted from the first line

import { writeFileSync } from 'fs';
import { agentContext, llms } from '#agent/agentContextLocalStorage';
import { AgentLLMs } from '#agent/agentContextTypes';
import { RunAgentConfig } from '#agent/agentRunner';
import { runAgentWorkflow } from '#agent/agentWorkflowRunner';
import { shutdownTrace } from '#fastify/trace-init/trace-init';
import { defaultLLMs } from '#llm/services/defaultLlms';
import { selectFilesAgent } from '#swe/discovery/selectFilesAgent';
import { appContext, initApplicationContext } from '../applicationContext';
import { parseProcessArgs } from './cli';

async function main() {
	const agentLLMs: AgentLLMs = defaultLLMs();
	await initApplicationContext();

	const { initialPrompt, resumeAgentId } = parseProcessArgs();

	console.log(`Prompt: ${initialPrompt}`);

	const config: RunAgentConfig = {
		agentName: `Select Files: ${initialPrompt}`,
		llms: agentLLMs,
		functions: [], //FileSystem,
		initialPrompt,
		resumeAgentId,
		humanInLoop: {
			budget: 2,
		},
	};

	await runAgentWorkflow(config, async () => {
		const agent = agentContext();
		agent.name = `Query: ${await llms().easy.generateText(
			`<query>\n${initialPrompt}\n</query>\n\nSummarise the query into only a terse few words for a short title (8 words maximum) for the name of the AI agent completing the task. Output the short title only, nothing else.`,
			{ id: 'Agent name' },
		)}`;
		await appContext().agentStateService.save(agent);

		let response: any = await selectFilesAgent(initialPrompt);
		response = JSON.stringify(response);
		console.log(response);

		writeFileSync('src/cli/files-out', response);
		console.log('Wrote output to src/cli/files-out');
	});

	await shutdownTrace();
}

main().then(
	() => console.log('done'),
	(e) => console.error(e),
);
