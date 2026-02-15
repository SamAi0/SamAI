export const LLM_MODELS = {
  FAST: 'deepseek-coder:6.7b-instruct-q4_K_M',
  CODE: 'deepseek-coder:6.7b-instruct-q4_K_M',
} as const

export type LLMModelKey = keyof typeof LLM_MODELS