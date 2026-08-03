import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CardPrintSpec } from '../printing'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
    padding: 20,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#2563eb', // Blue
  },
  content: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: '60%',
    flexDirection: 'column',
  },
  rightColumn: {
    width: '35%',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  photo: {
    width: 80,
    height: 100,
    backgroundColor: '#e5e7eb',
    marginBottom: 20,
    objectFit: 'cover',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  surname: {
    fontSize: 28,
    fontWeight: 'heavy',
    color: '#111827',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  qrContainer: {
    marginTop: 'auto',
    width: 80,
    height: 80,
  },
  qrPlaceholder: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
})

export const CardDocument = ({ spec }: { spec: CardPrintSpec }) => {
  return (
    <Document>
      <Page size={[338, 212]} style={styles.page}>
        <View style={styles.topBar} />
        <View style={styles.content}>
          <View style={styles.leftColumn}>
            {/* If photoUrl was available, we'd use <Image src={spec.photoUrl} style={styles.photo} /> */}
            <View style={styles.photo} />
            <Text style={styles.label}>AREAS</Text>
            <Text style={styles.footerText}>
              {/* Add areas to spec if needed, here we just show a placeholder */}
              RESTRICTED
            </Text>
          </View>
          <View style={styles.rightColumn}>
            <Text style={styles.name}>{spec.firstName}</Text>
            <Text style={styles.surname}>{spec.lastName}</Text>

            <View style={{ width: '100%', alignItems: 'flex-end' }}>
              <Text style={styles.label}>JOB TITLE</Text>
              <Text style={styles.value}>{spec.jobTitle}</Text>

              <Text style={styles.label}>ID NUMBER</Text>
              <Text style={styles.value}>{spec.nationalId}</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>QR CODE</Text>
                <Text style={{ fontSize: 6, color: '#9ca3af', marginTop: 4 }}>
                  {spec.qrCodeData}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
