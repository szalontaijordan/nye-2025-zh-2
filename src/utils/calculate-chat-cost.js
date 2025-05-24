const GPT_4_1 = 'gpt-4-1';
const GPT_4_1_mini = 'gpt-4-1-mini';
const GPT_o3 = 'gpt-o3';
// USD / 1 million tokens
const MODEL_COST_MAP = {
    [GPT_4_1]: {
        input: 2,
        output: 8
    },
    [GPT_4_1_mini]: {
        input: 0.4,
        output: 1.6
    },
    [GPT_o3]: {
        input: 10,
        output: 40
    }
};
const ONE_USD = 355.63; // HUF

/**
 * Calculates token costs in USD or HUF.
 *
 * Cost is calculated based on either the prompt, completion or total tokens, based on the parameters.
 * The funciton accepts 3 types of models, for each see the constants above. For the currency change
 * the function considers the {ONE_USD} constant above.
 *
 * If there is an unknown model in the conversation, a `warning` is made to the console (e.g. "Unknown model")
 * and it's counted as `0`.
 *
 * If the conversation is empty, the cost is 0 in both currencies
 *
 *  @param conversation array of chat responses such as
 * {
 *   "created": 1677858242,
 *   "model": "gpt-4-1",
 *   "usage": {
 *       "prompt_tokens": 13,
 *       "completion_tokens": 7,
 *       "total_tokens": 20
 *   },
 *   "choices": [ ...  ]
 * }
 * @param params {
 *  currency: 'USD' | 'HUF'
 *  count: 'prompt' | 'completion' | 'total'
 * }
 *
 * @return
 *  * string representation of the cost of the chat with max. 6 decimal points (e.g. "0.000435 USD")
 *  * if the currency is invalid the returned value is `N/A`
 *  * if the tokens to be counted are not from the enum the returned value is `N/A`
 */
export function calculateChatCost(conversation, params) {
    
    if (!params || !['USD', 'HUF'].includes(params.currency)) {
        return 'N/A';
    }
    
    if (!['prompt', 'completion', 'total'].includes(params.count)) {
        return 'N/A';
    }
    
    if (!conversation || conversation.length === 0) {
        return `0 ${params.currency}`;
    }
    
    let totalCostUSD = 0;
    
    for (const response of conversation) {
        const model = response.model;
        const usage = response.usage;
        
        if (!usage) {
            continue;
        }
        
        if (!MODEL_COST_MAP[model]) {
            console.warn("Unknown model");
            continue;
        }
        
        const modelCosts = MODEL_COST_MAP[model];
        let tokenCount = 0;
        let costPerMillionTokens = 0;
        
        switch (params.count) {
            case 'prompt':
                tokenCount = usage.prompt_tokens || 0;
                costPerMillionTokens = modelCosts.input;
                break;
            case 'completion':
                tokenCount = usage.completion_tokens || 0;
                costPerMillionTokens = modelCosts.output;
                break;
            case 'total':
                const promptTokens = usage.prompt_tokens || 0;
                const completionTokens = usage.completion_tokens || 0;
                
                const promptCost = (promptTokens / 1000000) * modelCosts.input;
                const completionCost = (completionTokens / 1000000) * modelCosts.output;
                
                totalCostUSD += promptCost + completionCost;
                continue;
            default:
                return 'N/A';
        }
        
        if (params.count !== 'total') {
            const cost = (tokenCount / 1000000) * costPerMillionTokens;
            totalCostUSD += cost;
        }
    }
    
    let finalCost = totalCostUSD;
    if (params.currency === 'HUF') {
        finalCost = totalCostUSD * ONE_USD;
    }
    
    const formattedCost = parseFloat(finalCost.toFixed(6));
    
    return `${formattedCost} ${params.currency}`;
}

