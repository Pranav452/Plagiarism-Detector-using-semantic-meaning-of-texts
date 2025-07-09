"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { analyzeSimilarity } from "./actions"

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

export default function PlagiarismDetector() {
  const [textSamples, setTextSamples] = useState<TextSample[]>([
    { id: "1", content: "", label: "Text 1" },
    { id: "2", content: "", label: "Text 2" },
  ])
  const [results, setResults] = useState<SimilarityResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addTextBox = () => {
    const newId = (textSamples.length + 1).toString()
    setTextSamples([
      ...textSamples,
      {
        id: newId,
        content: "",
        label: `Text ${newId}`,
      },
    ])
  }

  const removeTextBox = (id: string) => {
    if (textSamples.length > 2) {
      setTextSamples(textSamples.filter((sample) => sample.id !== id))
    }
  }

  const updateTextContent = (id: string, content: string) => {
    setTextSamples(textSamples.map((sample) => (sample.id === id ? { ...sample, content } : sample)))
  }

  const updateTextLabel = (id: string, label: string) => {
    setTextSamples(textSamples.map((sample) => (sample.id === id ? { ...sample, label } : sample)))
  }

  const analyzeTexts = async () => {
    const validTexts = textSamples.filter((sample) => sample.content.trim().length > 0)

    if (validTexts.length < 2) {
      setError("Please provide at least 2 text samples to compare")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const analysisResults = await analyzeSimilarity(validTexts)
      setResults(analysisResults)
    } catch (err) {
      setError("Failed to analyze texts. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return "text-red-600 bg-red-50"
    if (similarity >= 0.6) return "text-orange-600 bg-orange-50"
    if (similarity >= 0.4) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  const getSimilarityIcon = (similarity: number) => {
    if (similarity >= 0.8) return <XCircle className="w-4 h-4 text-red-600" />
    if (similarity >= 0.6) return <AlertTriangle className="w-4 h-4 text-orange-600" />
    return <CheckCircle className="w-4 h-4 text-green-600" />
  }

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return "High Risk"
    if (similarity >= 0.6) return "Medium Risk"
    if (similarity >= 0.4) return "Low Risk"
    return "No Risk"
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plagiarism Detector</h1>
        <p className="text-muted-foreground">
          Analyze semantic similarity between text samples using AI embeddings to detect potential plagiarism
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Text Samples</h2>
            <Button onClick={addTextBox} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Text
            </Button>
          </div>

          {textSamples.map((sample, index) => (
            <Card key={sample.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={sample.label}
                    onChange={(e) => updateTextLabel(sample.id, e.target.value)}
                    className="font-medium bg-transparent border-none outline-none focus:ring-0 p-0"
                  />
                  {textSamples.length > 2 && (
                    <Button onClick={() => removeTextBox(sample.id)} variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter text to analyze for plagiarism..."
                  value={sample.content}
                  onChange={(e) => updateTextContent(sample.id, e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="mt-2 text-sm text-muted-foreground">{sample.content.length} characters</div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={analyzeTexts} disabled={isAnalyzing} className="w-full" size="lg">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Similarity...
              </>
            ) : (
              "Analyze for Plagiarism"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Similarity Analysis</h2>

          {results.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Run analysis to see similarity results</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSimilarityIcon(result.similarity)}
                        <span className="font-medium">
                          {result.labels[0]} vs {result.labels[1]}
                        </span>
                      </div>
                      <Badge className={getSimilarityColor(result.similarity)}>
                        {getSimilarityLabel(result.similarity)}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Similarity Score</span>
                        <span className="font-mono">{(result.similarity * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.similarity * 100} className="h-2" />
                    </div>

                    {result.similarity >= 0.6 && (
                      <div className="mt-3 p-2 bg-orange-50 rounded-md">
                        <p className="text-sm text-orange-800">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          Potential plagiarism detected. Manual review recommended.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-red-600">High Risk Pairs</div>
                      <div className="text-2xl font-bold">{results.filter((r) => r.similarity >= 0.8).length}</div>
                    </div>
                    <div>
                      <div className="font-medium text-orange-600">Medium Risk Pairs</div>
                      <div className="text-2xl font-bold">
                        {results.filter((r) => r.similarity >= 0.6 && r.similarity < 0.8).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
