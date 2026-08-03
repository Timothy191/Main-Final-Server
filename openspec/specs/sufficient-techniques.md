# WCAG: Sufficient Techniques & Conformance

This document details the definition, evaluation, and application of **Sufficient Techniques**, **Advisory Techniques**, and **Failures** in the context of Web Content Accessibility Guidelines (WCAG) conformance.

## Sufficient Techniques
Sufficient techniques are reliable, documented ways to meet WCAG success criteria.

- **Author Perspective:** If you implement sufficient techniques correctly, and they are accessibility-supported for your user base, you meet the success criterion.
- **Evaluator Perspective:** If content correctly implements sufficient techniques, it conforms to the success criterion. However, not implementing them does not automatically imply failure; authors may use alternative undocumented techniques as long as they satisfy the success criterion's requirements.
- **Combinations ("AND"):** Multiple techniques grouped on a single item connected by "AND" must all be implemented together to be sufficient (e.g., using semantic elements *AND* marking up emphasized text).

## Advisory Techniques
Advisory techniques are suggestions to improve accessibility beyond the minimum success criteria.
- They may not satisfy the entire criterion on their own.
- They may rely on newer, less stable, or poorly supported assistive technologies.
- They may not be easily testable.
- Authors are highly encouraged to implement advisory techniques to support the widest possible range of users.

## Failures
Failures represent specific coding or design anti-patterns that create accessibility barriers.
- If content has a documented failure, it fails the respective WCAG success criteria (unless an alternative accessible version is provided).
- Failures are primary indicators for accessibility audits and automated checkers.

## Other Techniques
W3C techniques are not exhaustive or mandatory. Authors can create and implement their own custom techniques (e.g., for new frameworks or HTML5/ARIA specifications) if:
1. They successfully satisfy the success criterion.
2. They meet all other WCAG conformance requirements.

## Testing and Verification
Each technique contains associated tests to verify correct implementation.
- Passing a technique's test does not guarantee full WCAG compliance (as some criteria require general, non-technology-specific techniques).
- Failing a technique's test does not necessarily mean failing WCAG, because alternative sufficient techniques may have been used.
- Evaluating compliance must look at how the overall content conforms to the success criteria.
