/*
 
    TODO: implement function below based on the jsdoc.
          do not forget about your *HTML/CSS* task
          do not forget to run `npm run test` to check your work,
          otherwise the solution will not be accepted

          (NOTE: do not forget to run `npm install` in the forst place...)
          (NOTE: feel free to introduce new helper functions)
          (NOTE: if you see a buggy test, feel free to fix/report it)

 */
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
    const validCurrencies = ['USD', 'HUF'];
    const validCounts = ['prompt', 'completion', 'total'];

    if (!validCurrencies.includes(params.currency) || !validCounts.includes(params.count)) {
        return 'N/A';
    }

    if (!Array.isArray(conversation) || conversation.length === 0) {
        return `0 ${params.currency}`;
    }

    let totalCostUSD = 0;

    for (const message of conversation) {
        const { model, usage } = message;
        const modelCost = MODEL_COST_MAP[model];

        if (!modelCost) {
            console.warn("Unknown model");
            continue;
        }

        let tokens = 0;
        let costPerMillion = 0;

        switch (params.count) {
            case 'prompt':
                tokens = usage.prompt_tokens || 0;
                costPerMillion = modelCost.input;
                break;
            case 'completion':
                tokens = usage.completion_tokens || 0;
                costPerMillion = modelCost.output;
                break;
            case 'total':
                tokens = usage.total_tokens || 0;
                const total = usage.total_tokens || 1;
                const inputRatio = usage.prompt_tokens / total || 0;
                const outputRatio = usage.completion_tokens / total || 0;
                costPerMillion = inputRatio * modelCost.input + outputRatio * modelCost.output;
                break;
            default:
                return 'N/A';
        }

        const cost = (tokens / 1_000_000) * costPerMillion;
        totalCostUSD += cost;
    }

    let result = totalCostUSD;
    if (params.currency === 'HUF') {
        result *= ONE_USD;
    }

    const formatted = parseFloat(result.toFixed(6)).toString();

    return `${formatted} ${params.currency}`;
}
