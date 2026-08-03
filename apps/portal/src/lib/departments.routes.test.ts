import fs from 'node:fs'
import path from 'node:path'
import { DEPARTMENTS, getDepartmentTabs } from './departments'
import { isValidRedirect } from '../../proxy'

const APP_DIR = path.join(__dirname, '..', 'app')

function hrefToCandidates(href: string): string[] {
  const cleaned = href.replace(/\/$/, '') || '/'
  const segments = cleaned.split('/').filter(Boolean)
  const rel = segments.join(path.sep)

  return [
    path.join(APP_DIR, rel, 'page.tsx'),
    path.join(APP_DIR, '(departments)', rel, 'page.tsx'),
    path.join(APP_DIR, '(auth)', rel, 'page.tsx'),
    path.join(APP_DIR, 'hub', 'page.tsx'), // /hub
  ]
}

function pageExistsForHref(href: string): boolean {
  if (href === '/hub' || href === '/') {
    return (
      fs.existsSync(path.join(APP_DIR, 'hub', 'page.tsx')) ||
      fs.existsSync(path.join(APP_DIR, 'page.tsx'))
    )
  }
  return hrefToCandidates(href).some((candidate) => fs.existsSync(candidate))
}

function collectDeclaredHrefs(): string[] {
  const hrefs = new Set<string>()

  for (const dept of DEPARTMENTS) {
    hrefs.add(`/${dept.name}`)
    for (const action of dept.actions ?? []) {
      hrefs.add(action.href)
    }
    for (const tab of getDepartmentTabs(dept.name)) {
      const tabHref = tab.name === 'dashboard' ? `/${dept.name}` : `/${dept.name}/${tab.name}`
      hrefs.add(tabHref)
    }
  }

  return [...hrefs].sort()
}

describe('department route integrity', () => {
  it('every hub action and department tab has a matching page.tsx', () => {
    const missing: string[] = []
    for (const href of collectDeclaredHrefs()) {
      if (!pageExistsForHref(href)) {
        missing.push(href)
      }
    }
    expect(missing).toEqual([])
  })

  it('isValidRedirect allows department roots including access-card-actions and hub', () => {
    expect(isValidRedirect('/hub')).toBe(true)
    expect(isValidRedirect('/access-card-actions')).toBe(true)
    expect(isValidRedirect('/access-card-actions/print-cards')).toBe(true)
    expect(isValidRedirect('/drilling/drilling-operations')).toBe(true)
  })
})
