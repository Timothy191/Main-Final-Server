import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
})

export function ReportTemplate({ data }: { data: Record<string, unknown> }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Arch Systems Operational Report</Text>
          <Text style={{ fontSize: 12, marginBottom: 10 }}>
            Generated operational metrics report.
          </Text>
          <Text style={{ fontSize: 10 }}>Data: {JSON.stringify(data)}</Text>
        </View>
      </Page>
    </Document>
  )
}
