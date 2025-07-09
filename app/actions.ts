"use server"

import { embedMany, cosineSimilarity, EmbeddingModel, LanguageModelV1 } from "ai"
import { HfInference } from "@huggingface/inference"

// Initialize the Hugging Face Inference API client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Define your custom Hugging Face embedding model
const huggingFaceEmbeddingModel = (
  model: string
): EmbeddingModel & LanguageModelV1 => {
  return {
    provider: "huggingface",
    modelId: model,
    async doEmbed({ values, abortSignal }) {
      const embeddings = await hf.featureExtraction(
        {
          model: model,
          inputs: values,
        },
        {
          signal: abortSignal,
        }
      )

      return {
        embeddings: embeddings as number[][],
      }
    },
    // The following properties are part of the LanguageModelV1 interface
    // and may not be directly used for embeddings but are required for
    // the type to be compatible.
    async doGenerate(options) {
      // This method is not used for embeddings
      throw new Error("Not implemented")
    },
    async doStream(options) {
      // This method is not used for embeddings
      throw new Error("Not implemented")
    },
  }
}

interface TextSample {
  id: string
  content: string
  label: string
}

interface SimilarityResult {
  pair: [number, number]
  similarity: number
  labels: [string, string]
}

export async function analyzeSimilarity(textSamples: TextSample[]): Promise<SimilarityResult[]> {
  try {
    // Extract text content for embedding
    const texts = textSamples.map((sample) => sample.content.trim())

    // Generate embeddings for all texts
    const { embeddings } = await embedMany({
      model: huggingFaceEmbeddingModel("sentence-transformers/all-MiniLM-L6-v2"),
      values: texts,
    })

    // Calculate similarity between all pairs
    const results: SimilarityResult[] = []

    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        const similarity = cosineSimilarity(embeddings[i], embeddings[j])

        results.push({
          pair: [i, j],
          similarity,
          labels: [textSamples[i].label, textSamples[j].label],
        })
      }
    }

    // Sort by similarity (highest first)
    results.sort((a, b) => b.similarity - a.similarity)

    return results
  } catch (error) {
    console.error("Error analyzing similarity:", error)
    throw new Error("Failed to analyze text similarity")
  }
}
