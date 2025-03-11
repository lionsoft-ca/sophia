import { OpenAIProvider, createOpenAI } from '@ai-sdk/openai';
import { InputCostFunction, OutputCostFunction, perMilTokens } from '#llm/base-llm';
import { currentUser } from '#user/userService/userContext';
import { LLM } from '../llm';
import { AiLLM } from './ai-llm';

export const SAMBANOVA_SERVICE = 'sambanova';

export function sambanovaLLMRegistry(): Record<string, () => LLM> {
	return {
		'sambanova:DeepSeek-R1': sambanovaDeepseekR1,
		'sambanova:DeepSeek-R1-Distill-Llama-70B': sambanovaLlama3_3_70b_R1_Distill,
		'sambanova:Meta-Llama-3.3-70B-Instruct': sambanovaLlama3_3_70b,
	};
}

export function sambanovaDeepseekR1(): LLM {
	return new SambanovaLLM('DeepSeek R1 (Sambanova)', 'DeepSeek-R1', 8_192, perMilTokens(6), perMilTokens(7));
}

export function sambanovaLlama3_3_70b(): LLM {
	return new SambanovaLLM('Llama 3.3 70b (Sambanova)', 'Meta-Llama-3.3-70B-Instruct', 8_192, perMilTokens(0.6), perMilTokens(1.2));
}

export function sambanovaLlama3_3_70b_R1_Distill(): LLM {
	return new SambanovaLLM('Llama 3.3 70b R1 Distill (Sambanova)', 'DeepSeek-R1-Distill-Llama-70B', 8_192, perMilTokens(0.7), perMilTokens(1.5));
}

/**
 * https://inference-docs.sambanova.ai/introduction
 */
export class SambanovaLLM extends AiLLM<OpenAIProvider> {
	constructor(displayName: string, model: string, maxInputTokens: number, calculateInputCost: InputCostFunction, calculateOutputCost: OutputCostFunction) {
		super(displayName, SAMBANOVA_SERVICE, model, maxInputTokens, calculateInputCost, calculateOutputCost);
	}

	protected provider(): any {
		return createOpenAI({
			apiKey: this.apiKey(),
			baseURL: 'https://api.sambanova.ai/v1',
		});
	}

	protected apiKey(): string | undefined {
		return currentUser().llmConfig.sambanovaKey || process.env.SAMBANOVA_API_KEY;
	}
}
