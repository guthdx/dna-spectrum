'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { AssessmentResult } from '@/types';
import { ARCHETYPE_LABELS, ARCHETYPE_ANIMALS } from '@/types';

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        // Try to fetch from database API first
        const response = await fetch(`/api/assessment/${id}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setResult(data.data);
            setLoading(false);
            return;
          }
        }

        // Fallback to sessionStorage if database fetch fails
        console.log('Database fetch failed, trying sessionStorage...');
        const storedResult = sessionStorage.getItem(`assessment-${id}`);
        if (storedResult) {
          setResult(JSON.parse(storedResult));
        } else {
          setError('Assessment not found');
        }
      } catch (err) {
        console.error('Error loading assessment:', err);

        // Try sessionStorage as final fallback
        try {
          const storedResult = sessionStorage.getItem(`assessment-${id}`);
          if (storedResult) {
            setResult(JSON.parse(storedResult));
          } else {
            setError('Failed to load assessment results');
          }
        } catch (storageErr) {
          setError('Failed to load assessment results');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to load assessment results'}</p>
          <a
            href="/assessment"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Take New Assessment
          </a>
        </div>
      </div>
    );
  }

  const { scores, profile, interpretation, clientName } = result;

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = clientName
        ? `${clientName.replace(/[^a-z0-9]/gi, '_')}_DNA_Spectrum.pdf`
        : `DNA_Spectrum_Assessment.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {clientName ? `${clientName}'s Results` : 'Your Results'}
          </h1>
          <p className="text-gray-600">H2 DNA Spectrum Assessment</p>
        </div>

        {/* Archetype Scores */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Your Instinct Distribution
          </h2>

          <div className="space-y-4">
            {Object.entries(scores).map(([key, score]) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {ARCHETYPE_LABELS[key as keyof typeof ARCHETYPE_LABELS]}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({ARCHETYPE_ANIMALS[key as keyof typeof ARCHETYPE_ANIMALS]})
                    </span>
                  </div>
                  <span className="font-bold text-blue-600">{score.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual State Profile */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Your Dual State: {profile.profileName}
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Dominance Scale */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Dominance Scale</h3>
              <div className="relative">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${(profile.dominanceScore / 10) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {profile.dominanceScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {profile.dominanceScore >= 7
                    ? 'Active Dominance'
                    : profile.dominanceScore >= 4
                    ? 'Moderate Dominance'
                    : 'Lower Dominance'}
                </p>
              </div>
            </div>

            {/* Adaptiveness Scale */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3">Adaptiveness Scale</h3>
              <div className="relative">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full flex items-center justify-end px-2"
                    style={{ width: `${(profile.adaptivenessScore / 10) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {profile.adaptivenessScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {profile.adaptivenessScore >= 7
                    ? 'Responsive Sensitivity'
                    : profile.adaptivenessScore >= 4
                    ? 'Moderate Adaptiveness'
                    : 'Lower Adaptiveness'}
                </p>
              </div>
            </div>
          </div>

          {profile.isDualState && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Dual State Balance:</strong> You operate almost perfectly balanced
                between action and awareness. This is one of the rarest and most effective
                operating states.
              </p>
            </div>
          )}

          {/* Primary Archetypes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Primary Archetypes</h3>
              <div className="flex flex-wrap gap-2">
                {profile.primaryArchetypes.map((archetype) => (
                  <span
                    key={archetype}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {archetype}
                  </span>
                ))}
              </div>
            </div>
            {profile.secondaryArchetypes.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Secondary Archetypes</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.secondaryArchetypes.map((archetype) => (
                    <span
                      key={archetype}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {archetype}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interpretation */}
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interpretation</h2>

          {/* Core Instinct */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Core Instinct</h3>
            <p className="text-gray-700">{interpretation.coreInstinct}</p>
          </div>

          {/* Behavioral Signature */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Behavioral Signature
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {interpretation.behavioralSignature.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Strengths</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {interpretation.strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Watch Outs */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Watch Outs</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {interpretation.watchOuts.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Dual State Cue */}
          {interpretation.dualStateCue && (
            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-1">Dual State Cue</h3>
              <p className="text-yellow-900 italic">&ldquo;{interpretation.dualStateCue}&rdquo;</p>
            </div>
          )}

          {/* To Lead Yourself */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">To Lead Yourself</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {interpretation.toLeadYourself.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* To Partner With Others */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              To Partner With Others
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {interpretation.toPartnerWithOthers.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {downloadingPDF ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Print Results
          </button>
          <a
            href="/assessment"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-block"
          >
            Take New Assessment
          </a>
        </div>
      </div>
    </main>
  );
}
