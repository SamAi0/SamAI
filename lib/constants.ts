// Agent and model constants

// Model mappings for human-friendly names
export const AGENT_MODELS = {
  ollama: [
    // Add Ollama agent models
    { value: 'codellama', label: 'CodeLlama' },
    { value: 'qwen', label: 'Qwen' },
    { value: 'gemma3:1b', label: 'Gemma 1B' },
    { value: 'llama3', label: 'Llama 3' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'phi3', label: 'Phi-3' },
    { value: 'mixtral', label: 'Mixtral' },
    { value: 'deepseek-coder:6.7b-instruct-q4_K_M', label: 'DeepSeek Coder 6.7B' },
  ],
} as const

export const DEFAULT_MODELS = {
  ollama: 'codellama',
} as const

export const MAX_MESSAGES_PER_DAY = 100
export const MAX_TASK_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
