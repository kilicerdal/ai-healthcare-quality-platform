class OllamaClient {
  constructor() {
    this.baseUrl = (
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    ).replace(/\/+$/, '');

    this.model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
  }

  async generate(prompt) {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let response;

      try {
        response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            prompt,
            stream: false,
            options: {
              temperature: attempt === 1 ? 0.4 : 0.7,
              top_p: 0.9,
              repeat_penalty: 1.2,
              num_predict: 1024
            }
          }),
          signal: AbortSignal.timeout(120000)
        });
      } catch (error) {
        throw new Error(`Ollama connection failed: ${error.message}`);
      }

      if (response.ok) {
        let result;

        try {
          result = await response.json();
        } catch (error) {
          throw new Error(`Ollama returned invalid JSON: ${error.message}`);
        }

        if (
          typeof result.response !== 'string' ||
          !result.response.trim()
        ) {
          throw new Error('Ollama returned an empty response');
        }

        return result.response;
      }

      const errorDetails = await response.text();

      const isRepetitionError =
        response.status === 500 &&
        errorDetails.includes('token repeat limit reached');

      if (isRepetitionError && attempt < maxAttempts) {
        console.log('Ollama repetition detected. Retrying...');
        continue;
      }

      throw new Error(
        `Ollama request failed: HTTP ${response.status}\n${errorDetails}`
      );
    }
  }
}

module.exports = { OllamaClient };