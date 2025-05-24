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

    // 1. Input Validation
    if (!params || !validCurrencies.includes(params.currency) || !validCounts.includes(params.count)) {
        return 'N/A';
    }

    // 2. Handle Empty Conversation
    if (!conversation || conversation.length === 0) {
        return `0 ${params.currency}`;
    }

    let totalCostUSD = 0;
    const tokensPerMillion = 1_000_000;

    // 3. Iterate through Conversation
    for (const message of conversation) {
        const model = message.model;
        const usage = message.usage;

        if (!usage || typeof usage.prompt_tokens !== 'number' || typeof usage.completion_tokens !== 'number') {
             // Skip messages without valid usage data or handle as an error if needed
             // console.warn(`Message without valid usage data:`, message); // Kommenteld ki vagy töröld éles kódban, ha nem szükséges a figyelmeztetés a teszt miatt
             continue;
        }

        // 4. & 5. Get Model Cost and Handle Unknown Models
        const modelCosts = MODEL_COST_MAP[model];
        if (!modelCosts) {
            console.warn(`Unknown model: ${model}`);
            // Cost is 0 for unknown models
            continue;
        }

        // 6. & 7. Calculate Token Cost for the message
        let messageCostUSD = 0;
        if (params.count === 'prompt') {
            messageCostUSD = (usage.prompt_tokens / tokensPerMillion) * modelCosts.input;
        } else if (params.count === 'completion') {
            messageCostUSD = (usage.completion_tokens / tokensPerMillion) * modelCosts.output;
        } else if (params.count === 'total') {
            // Total cost is sum of prompt tokens * input cost + completion tokens * output cost
            messageCostUSD = (usage.prompt_tokens / tokensPerMillion) * modelCosts.input +
                             (usage.completion_tokens / tokensPerMillion) * modelCosts.output;
        }

        // 8. Accumulate Total Cost
        totalCostUSD += messageCostUSD;
    }

    let finalCost = totalCostUSD;

    // 9. Currency Conversion
    if (params.currency === 'HUF') {
        finalCost = totalCostUSD * ONE_USD;
    }

    // 10. Format Output
    // Round to max 6 decimal places. Use toFixed for precise decimal places then parse to remove trailing zeros
    // Note: parseFloat might introduce floating point inaccuracies for very small numbers,
    // but it's needed to remove trailing zeros as per example.
    // A more robust solution for financial calculations might use libraries or different rounding logic.
    let formattedCost = finalCost.toFixed(6);
    // Remove trailing zeros and decimal point if it becomes integer after rounding
    formattedCost = formattedCost.replace(/\.?0+$/, '');


    return `${formattedCost} ${params.currency}`;
}
