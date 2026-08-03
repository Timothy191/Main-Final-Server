export function getServiceUrls() {
  return {
    api: process.env.NEXT_PUBLIC_N8N_URL || 'http://localhost:5678',
    portal: process.env.NEXT_PUBLIC_FLOWISE_URL || 'http://localhost:3000',
  }
}
