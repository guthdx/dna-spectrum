/**
 * H2 DNA Spectrum - PDF Report Template
 *
 * Professional 4-page assessment report using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { AssessmentResult } from '@/types';
import { ARCHETYPE_LABELS, ARCHETYPE_ANIMALS } from '@/types';

// Register fonts (optional - uses Helvetica by default)
// Font.register({
//   family: 'Open Sans',
//   src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    fontSize: 24,
    marginBottom: 8,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 18,
    marginBottom: 16,
    color: '#374151',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#1f2937',
  },
  scoreValue: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  bulletList: {
    marginLeft: 12,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
  },
  scaleContainer: {
    marginBottom: 12,
  },
  scaleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  scaleBar: {
    height: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 4,
    position: 'relative',
  },
  scaleFill: {
    height: 20,
    borderRadius: 4,
  },
  scaleText: {
    fontSize: 9,
    color: '#6b7280',
  },
  highlight: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 10,
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
});

interface PDFTemplateProps {
  result: AssessmentResult;
}

export const AssessmentPDFDocument: React.FC<PDFTemplateProps> = ({ result }) => {
  const { clientName, scores, profile, interpretation } = result;

  return (
    <Document>
      {/* Page 1: Results Overview */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          {clientName ? `${clientName}'s Results` : 'Assessment Results'}
        </Text>
        <Text style={styles.text}>H2 DNA Spectrum: Instinct Self-Assessment</Text>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.subheader}>Your Instinct Distribution</Text>

          {Object.entries(scores).map(([key, value]) => (
            <View key={key} style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {ARCHETYPE_LABELS[key as keyof typeof ARCHETYPE_LABELS]}
                {' '}({ARCHETYPE_ANIMALS[key as keyof typeof ARCHETYPE_ANIMALS]})
              </Text>
              <Text style={styles.scoreValue}>{value.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Dual State Scales */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.subheader}>Dual State Profile</Text>

          <View style={styles.scaleContainer}>
            <Text style={styles.scaleLabel}>
              Dominance Scale: {profile.dominanceScore}/10
            </Text>
            <View style={styles.scaleBar}>
              <View
                style={[
                  styles.scaleFill,
                  {
                    width: `${(profile.dominanceScore / 10) * 100}%`,
                    backgroundColor: '#dc2626',
                  },
                ]}
              />
            </View>
            <Text style={styles.scaleText}>
              {profile.dominanceScore >= 7
                ? 'Active Dominance'
                : profile.dominanceScore >= 4
                ? 'Moderate Dominance'
                : 'Lower Dominance'}
            </Text>
          </View>

          <View style={styles.scaleContainer}>
            <Text style={styles.scaleLabel}>
              Adaptiveness Scale: {profile.adaptivenessScore}/10
            </Text>
            <View style={styles.scaleBar}>
              <View
                style={[
                  styles.scaleFill,
                  {
                    width: `${(profile.adaptivenessScore / 10) * 100}%`,
                    backgroundColor: '#16a34a',
                  },
                ]}
              />
            </View>
            <Text style={styles.scaleText}>
              {profile.adaptivenessScore >= 7
                ? 'Responsive Sensitivity'
                : profile.adaptivenessScore >= 4
                ? 'Moderate Adaptiveness'
                : 'Lower Adaptiveness'}
            </Text>
          </View>

          {profile.isDualState && (
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>
                <Text style={{ fontWeight: 'bold' }}>Dual State Balance: </Text>
                You operate almost perfectly balanced between action and awareness.
                This is one of the rarest and most effective operating states.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.footer}>
          H2 DNA Spectrum Assessment • Page 1 of 4 • Generated {new Date().toLocaleDateString()}
        </Text>
      </Page>

      {/* Page 2: Interpretation */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Interpretation</Text>
        <Text style={styles.subheader}>Your Dual State: {profile.profileName}</Text>

        {/* Primary Archetypes */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Primary Archetypes</Text>
          <Text style={styles.text}>
            {profile.primaryArchetypes.join(', ')}
          </Text>
          {profile.secondaryArchetypes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Secondary Archetypes</Text>
              <Text style={styles.text}>
                {profile.secondaryArchetypes.join(', ')}
              </Text>
            </>
          )}
        </View>

        {/* Core Instinct */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Core Instinct</Text>
          <Text style={styles.text}>{interpretation.coreInstinct}</Text>
        </View>

        {/* Behavioral Signature */}
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Behavioral Signature</Text>
          <View style={styles.bulletList}>
            {interpretation.behavioralSignature.map((item, idx) => (
              <Text key={idx} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          H2 DNA Spectrum Assessment • Page 2 of 4 • Generated {new Date().toLocaleDateString()}
        </Text>
      </Page>

      {/* Page 3: Strengths & Watch Outs */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Strengths & Watch Outs</Text>

        {/* Strengths */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Strengths</Text>
          <View style={styles.bulletList}>
            {interpretation.strengths.map((item, idx) => (
              <Text key={idx} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* Watch Outs */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Watch Outs</Text>
          <View style={styles.bulletList}>
            {interpretation.watchOuts.map((item, idx) => (
              <Text key={idx} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* Dual State Cue */}
        {interpretation.dualStateCue && (
          <View style={styles.highlight}>
            <Text style={[styles.highlightText, { fontWeight: 'bold', marginBottom: 4 }]}>
              Dual State Cue
            </Text>
            <Text style={[styles.highlightText, { fontStyle: 'italic' }]}>
              "{interpretation.dualStateCue}"
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          H2 DNA Spectrum Assessment • Page 3 of 4 • Generated {new Date().toLocaleDateString()}
        </Text>
      </Page>

      {/* Page 4: Leadership Guidance */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Leadership Guidance</Text>

        {/* To Lead Yourself */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>To Lead Yourself</Text>
          <View style={styles.bulletList}>
            {interpretation.toLeadYourself.map((item, idx) => (
              <Text key={idx} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* To Partner With Others */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>To Partner With Others</Text>
          <View style={styles.bulletList}>
            {interpretation.toPartnerWithOthers.map((item, idx) => (
              <Text key={idx} style={styles.bullet}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* Summary */}
        <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 8 }]}>
            Summary Statement
          </Text>
          <Text style={styles.text}>
            You lead as {profile.profileName.toLowerCase()} — operating
            {profile.isDualState ? ' in balanced Dual State between dominance and adaptiveness' : ''}.
            Your natural strengths in {profile.primaryArchetypes.join(' and ')}
            {' '}make you effective in situations requiring both decisive action and empathic awareness.
          </Text>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.text, { fontSize: 9, color: '#6b7280', textAlign: 'center' }]}>
            This assessment is based on the H2 DNA Spectrum framework.{'\n'}
            For more information, visit https://github.com/guthdx/dna-spectrum
          </Text>
        </View>

        <Text style={styles.footer}>
          H2 DNA Spectrum Assessment • Page 4 of 4 • Generated {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
};
