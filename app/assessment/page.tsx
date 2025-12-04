'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS } from '@/lib/questions';
import type { AssessmentResponse } from '@/types';

export default function AssessmentPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [clientName, setClientName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (Object.keys(responses).length / QUESTIONS.length) * 100;
  const allQuestionsAnswered = Object.keys(responses).length === QUESTIONS.length;

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName.trim()) {
      setShowNameInput(false);
    }
  };

  const handleResponse = (questionId: number, score: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: score,
    }));

    // Auto-advance to next unanswered question
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert responses to API format
      const assessmentResponses: AssessmentResponse[] = Object.entries(responses).map(
        ([questionId, score]) => ({
          questionId: parseInt(questionId),
          score,
        })
      );

      // Submit to API
      const response = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName || undefined,
          responses: assessmentResponses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const data = await response.json();

      // Store result in sessionStorage (temporary until database is connected)
      sessionStorage.setItem(
        `assessment-${data.data.assessmentId}`,
        JSON.stringify(data.data.result)
      );

      // Redirect to results
      router.push(`/results/${data.data.assessmentId}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getQuestionsByCategory = () => {
    const categories = {
      instinct: QUESTIONS.filter((q) => q.category === 'instinct'),
      pressure: QUESTIONS.filter((q) => q.category === 'pressure'),
      connection: QUESTIONS.filter((q) => q.category === 'connection'),
      focus: QUESTIONS.filter((q) => q.category === 'focus'),
    };
    return categories;
  };

  const categoryTitles = {
    instinct: 'Instinct & Regulation',
    pressure: 'Pressure & Control',
    connection: 'Connection & Safety',
    focus: 'Focus & Adaptation',
  };

  if (showNameInput) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            H2 DNA Spectrum Assessment
          </h1>
          <p className="text-gray-600 mb-6">
            This assessment will help identify your natural behavioral patterns and instincts.
          </p>

          <form onSubmit={handleNameSubmit}>
            <label className="block mb-4">
              <span className="text-gray-700 font-medium">Your Name (Optional)</span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-4 py-2 border"
              />
            </label>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Assessment
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-500 space-y-1">
            <p>• 30 questions</p>
            <p>• 5-10 minutes</p>
            <p>• Instant results with detailed profile</p>
          </div>
        </div>
      </main>
    );
  }

  const categories = getQuestionsByCategory();
  const currentCategoryQuestions = Object.values(categories).flat();
  const question = QUESTIONS[currentQuestion];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {Object.keys(responses).length} / {QUESTIONS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-6">
          <div className="mb-4">
            <span className="text-sm font-medium text-blue-600">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {question.text}
          </h2>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => handleResponse(question.id, score)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  responses[question.id] === score
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{score}</span>
                  <span className="text-sm text-gray-600">
                    {score === 1 && 'Rarely true for me'}
                    {score === 2 && 'Sometimes'}
                    {score === 3 && 'Often'}
                    {score === 4 && 'Usually'}
                    {score === 5 && 'Almost always true'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {allQuestionsAnswered ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & View Results'}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion(Math.min(QUESTIONS.length - 1, currentQuestion + 1))
              }
              disabled={currentQuestion === QUESTIONS.length - 1}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>

        {/* Question Overview */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Question Overview</h3>
          <div className="grid grid-cols-10 gap-2">
            {QUESTIONS.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                  responses[q.id]
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : currentQuestion === idx
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
                title={`Question ${q.id}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
