import { calculateChatCost } from "../calculate-chat-cost";

describe('calculateChatCost', () => {

    const conversation = [
        {
            model: 'gpt-4-1',
            usage: {
                prompt_tokens: 1_000_000,
                completion_tokens: 1_000_000,
                total_tokens: 2_000_000
            }
        }
    ];

    const warnSpy = jest.spyOn(console, 'warn');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle HUF as a curerncy', () => {
        const params = {
            currency: 'HUF',
            count: 'total'
        }
        const result = calculateChatCost(conversation, params);
        expect(result).toEqual('3556.3 HUF');
    })

    it('should count prompt correctly', () => {
        const params = {
            currency: 'USD',
            count: 'prompt'
        }
        const result = calculateChatCost(conversation, params);
        expect(result).toEqual('2 USD');
    });

    it('should count completion correctly', () => {
        const params = {
            currency: 'USD',
            count: 'completion'
        }
        const result = calculateChatCost(conversation, params);
        expect(result).toEqual('8 USD');
    });

    it('should return N/A in case of invalid parameters', () => {
        const na1 = calculateChatCost([], {});
        const na2 = calculateChatCost([], { currency: 'EUR' });
        const na3 = calculateChatCost([], { currency: 'USD', count: true });

        expect(na1).toEqual('N/A');
        expect(na2).toEqual('N/A');
        expect(na3).toEqual('N/A');
    });

    it('should warn if there is an unknown model counting 0 cost', () => {
        const result = calculateChatCost([{ model: 'unknown', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }], { currency: 'USD', count: 'total' });
        expect(warnSpy).toBeCalledTimes(1);
        expect(result).toEqual('0 USD');
    });

    it('should return 0 if the conversation is empty', () => {
        const result = calculateChatCost([], { currency: 'USD', count: 'total' });
        expect(result).toEqual('0 USD');
    });

    it('should count token cost in USD properly', () => {
        const params = {
            currency: 'USD',
            count: 'total'
        }
        const result = calculateChatCost(conversation, params);
        expect(result).toEqual('10 USD');
    });

    it('should handle mixed conversations', () => {
        const mixedConversation = [
            ...conversation,
            {
                ...conversation[0],
                model: 'gpt-4-1-mini',
            },
            {
                ...conversation[0],
                model: 'gpt-o3'
            },
            {
                ...conversation[0],
                model: 'unknown'
            }
        ];

        const params = {
            count: 'total',
            currency: 'USD'
        }
        const result = calculateChatCost(mixedConversation, params);
        expect(result).toEqual('62 USD');
    });

    it('should consider the cost for million tokens', () => {
        const smallConversation = [
            {
                ...conversation[0],
                usage: {
                    prompt_tokens: 100,
                    completion_tokens: 50,
                    total_tokens: 200
                }
            }
        ];
        const params = {
            count: 'total',
            currency: 'USD'
        };
        const result = calculateChatCost(smallConversation, params);
        expect(result).toEqual('0.0006 USD');
    });

    it('should round to 6 decimal points max', () => {
        const smallConversation = [
            {
                model: 'gpt-4-1-mini',
                usage: {
                    prompt_tokens: 1,
                    completion_tokens: 1,
                    total_tokens: 2
                }
            }
        ];
        const params = {
            count: 'total',
            currency: 'HUF'
        };
        const result = calculateChatCost(smallConversation, params);
        expect(result).toEqual('0.000711 HUF');
    })
});
