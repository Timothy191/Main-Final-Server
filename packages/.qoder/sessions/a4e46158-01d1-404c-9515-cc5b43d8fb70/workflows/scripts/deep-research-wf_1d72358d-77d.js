export const meta = {
  name: "deep-research",
  description: "Deep research harness - fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report.",
  whenToUse: "When the user wants a deep, multi-source, fact-checked research report on any topic. Before invoking, check whether the question is specific enough to research directly; if underspecified, ask 2-3 clarifying questions, then pass the refined question as args.",
  phases: [
    { title: "Scope", detail: "Decompose question from args into 5 search angles" },
    { title: "Search", detail: "Run 5 parallel WebSearch agents, one per angle" },
    { title: "Fetch", detail: "Deduplicate URLs, fetch the top 15 sources, and extract falsifiable claims" },
    { title: "Verify", detail: "Use 3-vote adversarial verification per claim; 2 refutations reject a claim" },
    { title: "Synthesize", detail: "Merge findings, rank confidence, cite sources" }
  ]
};

const QUESTION = typeof args === "string" ? args.trim() : "";
if (!QUESTION) {
  return {
    error: "No research question provided. Pass it as args: Workflow({ name: \"deep-research\", args: \"<question>\" })."
  };
}

const ANGLES_SCHEMA = {
  type: "object",
  required: ["question", "summary", "angles"],
  properties: {
    question: { type: "string" },
    summary: { type: "string" },
    angles: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        required: ["label", "query"],
        properties: {
          label: { type: "string" },
          query: { type: "string" },
          rationale: { type: "string" }
        }
      }
    }
  }
};

const SEARCH_SCHEMA = {
  type: "object",
  required: ["results"],
  properties: {
    results: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        required: ["url", "title", "relevance"],
        properties: {
          url: { type: "string" },
          title: { type: "string" },
          snippet: { type: "string" },
          relevance: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    }
  }
};

const CLAIMS_SCHEMA = {
  type: "object",
  required: ["sourceQuality", "claims"],
  properties: {
    sourceQuality: { type: "string", enum: ["primary", "secondary", "blog", "forum", "unreliable"] },
    publishDate: { type: "string" },
    claims: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        required: ["claim", "quote", "importance"],
        properties: {
          claim: { type: "string" },
          quote: { type: "string" },
          importance: { type: "string", enum: ["central", "supporting", "tangential"] }
        }
      }
    }
  }
};

const VERDICT_SCHEMA = {
  type: "object",
  required: ["refuted", "evidence", "confidence"],
  properties: {
    refuted: { type: "boolean" },
    evidence: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    counterSource: { type: "string" }
  }
};

const REPORT_SCHEMA = {
  type: "object",
  required: ["summary", "findings", "caveats"],
  properties: {
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["claim", "confidence", "sources", "evidence"],
        properties: {
          claim: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          sources: { type: "array", items: { type: "string" } },
          evidence: { type: "string" },
          vote: { type: "string" }
        }
      }
    },
    caveats: { type: "string" },
    openQuestions: { type: "array", items: { type: "string" } }
  }
};

const VOTES_PER_CLAIM = 3;
const REFUTATIONS_REQUIRED = 2;
const MAX_FETCH = 15;
const MAX_VERIFY_CLAIMS = 25;
const URL_HOST_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#\\]*@)?(?:www\.)?([^/:?#@\\]+)(?::\d+)?([^?#]*)/i;
const normalizeUrl = (url) => {
  const match = String(url).match(URL_HOST_PATTERN);
  return match
    ? (match[1] + match[2].replace(/\/$/, "")).toLowerCase()
    : String(url).toLowerCase();
};
const LABEL_CAP = 40;
const LABEL_STRIP = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\u0022\u201c-\u201f\u2033\u2036\u275d\u275e\u301d\u301e\uff02]/g;
const STRICT_HOST = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;
const stripLabelChars = (value) => String(value).replace(LABEL_STRIP, "");
const quotedLabel = (value) => {
  const codePoints = Array.from(stripLabelChars(value));
  return "\"" + codePoints.slice(0, LABEL_CAP).join("").trim() +
    (codePoints.length > LABEL_CAP ? "…" : "") + "\"";
};
const sourceLabel = (source) => {
  const capturedHost = String(source.url).match(URL_HOST_PATTERN)?.[1] || "";
  const host = capturedHost.toLowerCase();
  const cleanHost = stripLabelChars(host);
  const isCleanBareHost = cleanHost === host && host !== "" &&
    Array.from(host).length <= LABEL_CAP && STRICT_HOST.test(host);
  const hostLabel = cleanHost === "" ? "" : isCleanBareHost ? host : quotedLabel(host);
  return hostLabel ||
    (stripLabelChars(source.title).trim() && quotedLabel(source.title)) ||
    "unknown";
};

phase("Scope");
const scope = await agent(
  "Decompose this research question into complementary search angles.\n\n" +
    "Question: " + QUESTION + "\n\n" +
    "Generate 5 distinct web search queries that together cover the question from different angles. " +
    "Include broad or primary sources, technical or academic evidence, recent developments, skeptical views, and practical tradeoffs when relevant. " +
    "Make queries specific and non-redundant. Return the question, a short strategy summary, and the angles. Structured output only.",
  { label: "scope", phase: "Scope", schema: ANGLES_SCHEMA }
);
if (!scope) {
  return { error: "Scope agent returned no result - cannot decompose the research question." };
}
log("Question: " + QUESTION.slice(0, 80) + (QUESTION.length > 80 ? "…" : ""));
log("Decomposed into " + scope.angles.length + " angles: " + scope.angles.map((angle) => angle.label).join(", "));

const seen = new Map();
const duplicates = [];
const budgetDropped = [];
const relevanceRank = { high: 0, medium: 1, low: 2 };
let fetchSlots = MAX_FETCH;

const searchResults = await pipeline(
  scope.angles,
  (angle) =>
    agent(
      "Use WebSearch to research this angle.\n\n" +
        "Original question: " + QUESTION + "\n" +
        "Angle: " + angle.label + " - " + (angle.rationale || "") + "\n" +
        "Search query: " + angle.query + "\n\n" +
        "Return the top 4-6 relevant results. Rank relevance against the original question, skip SEO spam, and include why each result matters. Structured output only.",
      { label: "search:" + angle.label, phase: "Search", schema: SEARCH_SCHEMA }
    ).then((result) => {
      if (!result) return null;
      log(angle.label + ": " + result.results.length + " search results");
      return { angle: angle.label, results: result.results };
    }),
  (searchResult) => {
    const sorted = [...searchResult.results].sort(
      (a, b) => relevanceRank[a.relevance] - relevanceRank[b.relevance]
    );
    const novel = sorted.filter((result) => {
      const key = normalizeUrl(result.url);
      if (seen.has(key)) {
        duplicates.push({ ...result, angle: searchResult.angle, duplicateOf: seen.get(key) });
        return false;
      }
      if (fetchSlots <= 0 && relevanceRank[result.relevance] >= 1) {
        budgetDropped.push({ ...result, angle: searchResult.angle });
        return false;
      }
      seen.set(key, { angle: searchResult.angle, title: result.title });
      fetchSlots--;
      return true;
    });
    if (novel.length < searchResult.results.length) {
      log(searchResult.angle + ": " + novel.length + " novel (" +
        (searchResult.results.length - novel.length) + " filtered)");
    }
    return parallel(
      novel.map((source) => () =>
        agent(
          "Use WebFetch to read this source and extract checkable claims relevant to the research question.\n\n" +
            "Question: " + QUESTION + "\n" +
            "Source URL: " + source.url + "\n" +
            "Source title: " + source.title + "\n" +
            "Found via angle: " + searchResult.angle + "\n\n" +
            "Assess source quality and extract 2-5 concrete, falsifiable claims with a direct supporting quote and importance rating. " +
            "If the page fails, is irrelevant, or is paywalled, return sourceQuality=\"unreliable\" and claims=[]. Structured output only.",
          { label: "fetch:" + sourceLabel(source), phase: "Fetch", schema: CLAIMS_SCHEMA }
        ).then((result) => {
          if (!result) return null;
          return {
            url: source.url,
            title: source.title,
            angle: searchResult.angle,
            sourceQuality: result.sourceQuality,
            publishDate: result.publishDate,
            claims: result.claims.map((claim) => ({
              ...claim,
              sourceUrl: source.url,
              sourceQuality: result.sourceQuality
            }))
          };
        }).catch((error) => {
          log("fetch failed: " + source.url + " - " + (error && error.message ? error.message : String(error)));
          return {
            url: source.url,
            title: source.title,
            angle: searchResult.angle,
            sourceQuality: "unreliable",
            claims: []
          };
        })
      )
    );
  }
);

const sources = searchResults.flat().filter(Boolean);
const allClaims = sources.flatMap((source) => source.claims);
const importanceRank = { central: 0, supporting: 1, tangential: 2 };
const qualityRank = { primary: 0, secondary: 1, blog: 2, forum: 3, unreliable: 4 };
const claims = [...allClaims]
  .sort((a, b) =>
    (importanceRank[a.importance] - importanceRank[b.importance]) ||
    (qualityRank[a.sourceQuality] - qualityRank[b.sourceQuality])
  )
  .slice(0, MAX_VERIFY_CLAIMS);
log("Fetched " + sources.length + " sources -> " + allClaims.length +
  " claims -> verifying top " + claims.length);

if (claims.length === 0) {
  return {
    question: QUESTION,
    summary: "No claims extracted. " + sources.length + " sources fetched, all empty or failed. " +
      duplicates.length + " URL duplicates, " + budgetDropped.length + " budget-dropped.",
    findings: [],
    refuted: [],
    unverified: [],
    sources: sources.map((source) => ({ url: source.url, quality: source.sourceQuality })),
    stats: {
      angles: scope.angles.length,
      sources: sources.length,
      claims: 0,
      urlDupes: duplicates.length,
      budgetDropped: budgetDropped.length
    }
  };
}

phase("Verify");
const voted = (await parallel(
  claims.map((claim) => () =>
    parallel(
      Array.from({ length: VOTES_PER_CLAIM }, (_, vote) => () =>
        agent(
          "Be skeptical and try to refute this claim. At least " + REFUTATIONS_REQUIRED +
            "/" + VOTES_PER_CLAIM + " refutations reject it.\n\n" +
            "Research question: " + QUESTION + "\n" +
            "Claim: " + claim.claim + "\n" +
            "Source: " + claim.sourceUrl + " (" + claim.sourceQuality + ")\n" +
            "Supporting quote: " + claim.quote + "\n\n" +
            "Check whether the quote really supports the claim, search for credible contradictory evidence, " +
            "judge whether source quality matches the claim strength, and check whether the claim is outdated or promotional. " +
            "Set refuted=true for unsupported, contradicted, outdated, or inadequately sourced claims. " +
            "Set refuted=false only when the claim is well-supported and current; default to refuted when uncertain. " +
            "Evidence must be specific. Structured output only.",
          { label: "v" + vote + ":" + claim.claim.slice(0, 40), phase: "Verify", schema: VERDICT_SCHEMA }
        )
      )
    ).then((verdicts) => {
      const valid = verdicts.filter(Boolean);
      const refutedVotes = valid.filter((verdict) => verdict.refuted).length;
      const erroredVotes = VOTES_PER_CLAIM - valid.length;
      const survives = valid.length >= REFUTATIONS_REQUIRED && refutedVotes < REFUTATIONS_REQUIRED;
      const isRefuted = refutedVotes >= REFUTATIONS_REQUIRED;
      const mark = survives ? "confirmed" : isRefuted ? "refuted" : "unverified";
      log(mark + ": " + claim.claim.slice(0, 70) +
        (erroredVotes > 0 ? " (" + erroredVotes + " verifier errors)" : ""));
      return {
        ...claim,
        verdicts: valid,
        refutedVotes,
        erroredVotes,
        survives,
        isRefuted
      };
    })
  )
)).filter(Boolean);

const confirmed = voted.filter((claim) => claim.survives);
const refuted = voted.filter((claim) => claim.isRefuted);
const unverified = voted.filter((claim) => !claim.survives && !claim.isRefuted);
log("Verified " + voted.length + " claims; confirmed " + confirmed.length +
  ", refuted " + refuted.length + ", unverified " + unverified.length);

const toRefuted = (claim) => ({
  claim: claim.claim,
  source: claim.sourceUrl,
  vote: (claim.verdicts.length - claim.refutedVotes) + "-" + claim.refutedVotes
});
const toUnverified = (claim) => ({
  claim: claim.claim,
  source: claim.sourceUrl,
  validVotes: claim.verdicts.length,
  erroredVotes: claim.erroredVotes
});

if (confirmed.length === 0) {
  let summary;
  if (refuted.length === 0 && unverified.length > 0) {
    summary = "Could not verify any claims - all " + unverified.length +
      " verifier panels failed. This is an infrastructure failure, not a research finding. Retry or verify manually.";
  } else if (unverified.length > 0) {
    summary = refuted.length + " claims were refuted; " + unverified.length +
      " could not be verified because verifier agents failed. Research is inconclusive.";
  } else {
    summary = "All " + refuted.length +
      " claims were refuted by adversarial verification. Research is inconclusive.";
  }
  return {
    question: QUESTION,
    summary,
    findings: [],
    refuted: refuted.map(toRefuted),
    unverified: unverified.map(toUnverified),
    sources: sources.map((source) => ({ url: source.url, quality: source.sourceQuality, claimCount: source.claims.length })),
    stats: {
      angles: scope.angles.length,
      sources: sources.length,
      claims: allClaims.length,
      verified: voted.length,
      confirmed: 0,
      killed: refuted.length,
      unverified: unverified.length,
      urlDupes: duplicates.length,
      budgetDropped: budgetDropped.length
    }
  };
}

phase("Synthesize");
const confidenceRank = { high: 0, medium: 1, low: 2 };
const evidenceBlock = confirmed.map((claim, index) => {
  const best = claim.verdicts
    .filter((verdict) => !verdict.refuted)
    .sort((a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence])[0];
  return "[" + index + "] " + claim.claim + "\n" +
    "Vote: " + (claim.verdicts.length - claim.refutedVotes) + "-" + claim.refutedVotes + "\n" +
    "Source: " + claim.sourceUrl + " (" + claim.sourceQuality + ")\n" +
    "Quote: " + claim.quote + "\n" +
    "Verifier evidence: " + (best ? best.evidence : "No supporting verifier evidence.");
}).join("\n\n");

const refutedBlock = refuted.length > 0
  ? "\n\nRefuted claims for transparency:\n" +
    refuted.map((claim) => "- " + claim.claim + " (" + claim.sourceUrl + ", vote " +
      (claim.verdicts.length - claim.refutedVotes) + "-" + claim.refutedVotes + ")").join("\n")
  : "";
const unverifiedBlock = unverified.length > 0
  ? "\n\nUnverified claims (" + unverified.length +
    " - verifier agents failed; neither confirmed nor refuted):\n" +
    unverified.map((claim) => "- " + claim.claim + " (" + claim.sourceUrl + ", " +
      claim.erroredVotes + "/" + VOTES_PER_CLAIM + " votes errored)").join("\n") +
    "\nMention these infrastructure failures in the caveats."
  : "";

const report = await agent(
  "Write a concise research report answering the question.\n\n" +
    "Question: " + QUESTION + "\n\n" +
    confirmed.length + " claims survived " + VOTES_PER_CLAIM + "-vote adversarial verification.\n\n" +
    "Confirmed claims:\n" + evidenceBlock + refutedBlock + unverifiedBlock + "\n\n" +
    "Merge semantic duplicates and combine their sources. Group related claims into findings, cite source URLs, " +
    "assign confidence based on source quality and vote strength, write a short executive summary, note caveats, " +
    "and list open questions. Structured output only.",
  { label: "synthesize", phase: "Synthesize", schema: REPORT_SCHEMA }
);

if (!report) {
  return {
    question: QUESTION,
    summary: "Synthesis was skipped or failed - returning " + confirmed.length +
      " verified claims without merging.",
    findings: [],
    confirmed: confirmed.map((claim) => ({
      claim: claim.claim,
      source: claim.sourceUrl,
      quote: claim.quote,
      vote: (claim.verdicts.length - claim.refutedVotes) + "-" + claim.refutedVotes
    })),
    refuted: refuted.map(toRefuted),
    unverified: unverified.map(toUnverified),
    sources: sources.map((source) => ({
      url: source.url,
      quality: source.sourceQuality,
      claimCount: source.claims.length
    })),
    stats: {
      angles: scope.angles.length,
      sources: sources.length,
      claims: allClaims.length,
      verified: voted.length,
      confirmed: confirmed.length,
      killed: refuted.length,
      unverified: unverified.length,
      afterSynthesis: 0,
      urlDupes: duplicates.length,
      budgetDropped: budgetDropped.length
    }
  };
}

return {
  question: QUESTION,
  ...report,
  refuted: refuted.map(toRefuted),
  unverified: unverified.map(toUnverified),
  sources: sources.map((source) => ({ url: source.url, quality: source.sourceQuality, angle: source.angle, claimCount: source.claims.length })),
  stats: {
    angles: scope.angles.length,
    sourcesFetched: sources.length,
    claimsExtracted: allClaims.length,
    claimsVerified: voted.length,
    confirmed: confirmed.length,
    killed: refuted.length,
    unverified: unverified.length,
    afterSynthesis: report.findings.length,
    urlDupes: duplicates.length,
    budgetDropped: budgetDropped.length,
    agentCalls: 1 + scope.angles.length + sources.length +
      (voted.length * VOTES_PER_CLAIM) + 1
  }
};