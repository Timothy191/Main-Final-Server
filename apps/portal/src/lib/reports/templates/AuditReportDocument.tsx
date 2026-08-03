import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AuditReportData } from '../audit-aggregator'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6', // Royal blue highlight
    paddingBottom: 15,
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '33.33%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  cardHalf: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  cardInner: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  cardTitle: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'medium',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

export const AuditReportDocument = ({ data }: { data: AuditReportData }) => {
  const { metrics, reportDate, generatedAt } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Plantcor Operations Compliance Audit</Text>
          <Text style={styles.subtitle}>
            Report Date: {reportDate} | Generated: {new Date(generatedAt).toLocaleString()}
          </Text>
        </View>

        {/* Access Control Department */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Access Control System</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Total Check-Ins</Text>
                <Text style={styles.cardValue}>{metrics.accessControl.checkIns}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Total Check-Outs</Text>
                <Text style={styles.cardValue}>{metrics.accessControl.checkOuts}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Access Denials</Text>
                <Text style={styles.cardValue}>{metrics.accessControl.denials}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Drilling Department */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drilling Operations</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Holes Drilled</Text>
                <Text style={styles.cardValue}>{metrics.drilling.totalHoles}</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Meters Drilled</Text>
                <Text style={styles.cardValue}>{metrics.drilling.totalMeters.toFixed(1)} m</Text>
              </View>
            </View>
            <View style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Total Downtime</Text>
                <Text style={styles.cardValue}>{metrics.drilling.totalDowntimeMinutes} min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Production Department */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production & Excavation</Text>
          <View style={styles.grid}>
            <View style={styles.cardHalf}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Coal Produced</Text>
                <Text style={styles.cardValue}>
                  {metrics.production.totalCoalTonnes.toFixed(1)} t
                </Text>
              </View>
            </View>
            <View style={styles.cardHalf}>
              <View style={styles.cardInner}>
                <Text style={styles.cardTitle}>Waste Excavated</Text>
                <Text style={styles.cardValue}>
                  {metrics.production.totalWasteTonnes.toFixed(1)} t
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Plantcor Site Safety & Compliance Report • System Generated • Confidential
        </Text>
      </Page>
    </Document>
  )
}
