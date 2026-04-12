import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type { ApiRequestBody } from '@/lib/types';
import { ADVISORY_DISCLAIMER } from '@/lib/constants';
import { appConfig } from '@/lib/config';
import { apiError } from '@/lib/api-response';
import { mockCases, mockModels, mockVerdictLedger } from '@/lib/mock-data';

type ActionMode =
  | 'case_analysis'
  | 'evidence_analysis'
  | 'juror_guidance'
  | 'precedent_search'
  | 'model_risk_analysis';

type DisagreementMeter = 'low' | 'medium' | 'high';

type CouncilBrief = {
  label: 'AI Case Brief';
  analysisType: 'Non-Binding AI Analysis';
  thesis: string;
  keyArguments: string[];
  citedEvidence: string[];
  legalTheory: string;
  vulnerabilities: string[];
  confidence: number;
  uncertaintyNotes: string[];
};

type NeutralSynthesis = {
  label: 'AI Case Brief';
  analysisType: 'Non-Binding AI Analysis';
  synthesisSummary: string;
  strongestProsecutionPoints: string[];
  strongestDefensePoints: string[];
  unresolvedQuestions: string[];
  jurorGuidance: string[];
  confidence: number;
  uncertaintyNotes: string[];
};

type AiCouncilResponseData = {
  schemaVersion: '1.0.0';
  label: 'AI Case Brief';
  analysisType: 'Non-Binding AI Analysis';
  actionMode: ActionMode;
  advisoryOnly: true;
  humanAuthority: 'Human jurors remain final authority';
  prosecutionBrief: CouncilBrief;
  defenseBrief: CouncilBrief;
  neutralSynthesis: NeutralSynthesis;
  evidenceGaps: string[];
  contradictions: string[];
  confidenceAndUncertaintyNotes: string[];
  recommendedQuestionsForJurors: string[];
  aiDisagreementMeter: DisagreementMeter;
  conflictFirewall: {
    accusedProvider: string;
    assistingModelFamily: string;
    conflictDetected: boolean;
    routedProvider: string | null;
    fallbackModeFlagged: boolean;
    notes: string[];
  };
  advisoryDisclaimer: typeof ADVISORY_DISCLAIMER;
};

type AiCouncilEnvelope = {
  success: true;
  data: AiCouncilResponseData;
  model: string;
  fallbackMode: boolean;
  source: 'mock' | 'live';
  advisory: typeof ADVISORY_DISCLAIMER;
};

const ActionModeSchema = z.enum([
  'case_analysis',
  'evidence_analysis',
  'juror_guidance',
  'precedent_search',
  'model_risk_analysis',
]);

const DisagreementMeterSchema = z.enum(['low', 'medium', 'high']);

const CouncilBriefSchema = z.object({
  label: z.literal('AI Case Brief'),
  analysisType: z.literal('Non-Binding AI Analysis'),
  thesis: z.string(),
  keyArguments: z.array(z.string()),
  citedEvidence: z.array(z.string()),
  legalTheory: z.string(),
  vulnerabilities: z.array(z.string()),
  confidence: z.number(),
  uncertaintyNotes: z.array(z.string()),
});

const NeutralSynthesisSchema = z.object({
  label: z.literal('AI Case Brief'),
  analysisType: z.literal('Non-Binding AI Analysis'),
  synthesisSummary: z.string(),
  strongestProsecutionPoints: z.array(z.string()),
  strongestDefensePoints: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  jurorGuidance: z.array(z.string()),
  confidence: z.number(),
  uncertaintyNotes: z.array(z.string()),
});

const ConflictFirewallSchema = z.object({
  accusedProvider: z.string(),
  assistingModelFamily: z.string(),
  conflictDetected: z.boolean(),
  routedProvider: z.string().nullable(),
  fallbackModeFlagged: z.boolean(),
  notes: z.array(z.string()),
});

const AiCouncilResponseSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  label: z.literal('AI Case Brief'),
  analysisType: z.literal('Non-Binding AI Analysis'),
  actionMode: ActionModeSchema,
  advisoryOnly: z.literal(true),
  humanAuthority: z.literal('Human jurors remain final authority'),
  prosecutionBrief: CouncilBriefSchema,
  defenseBrief: CouncilBriefSchema,
  neutralSynthesis: NeutralSynthesisSchema,
  evidenceGaps: z.array(z.string()),
  contradictions: z.array(z.string()),
  confidenceAndUncertaintyNotes: z.array(z.string()),
  recommendedQuestionsForJurors: z.array(z.string()),
  aiDisagreementMeter: DisagreementMeterSchema,
  conflictFirewall: ConflictFirewallSchema,
  advisoryDisclaimer: z.literal(ADVISORY_DISCLAIMER),
});

const RequestSchema = z.object({
  action: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const resolveAction = (action: string): string => {
  const aliases: Record<string, string> = {
    'cases.analyze': 'analyze_case',
    'cases.submit': 'analyze_case',
    'registry.register_model': 'register_model_analysis',
    'evidence.analyze': 'analyze_evidence',
    'adversarial_council': 'adversarial_council',
    'case_analysis': 'adversarial_council',
    'evidence_analysis': 'adversarial_council',
    'juror_guidance': 'adversarial_council',
    'precedent_search': 'adversarial_council',
    'model_risk_analysis': 'adversarial_council',
  };

  return aliases[action] || action;
};

const createAiClient = (): GoogleGenerativeAI | null => {
  if (!appConfig.googleApiKey) {
    return null;
  }

  return new GoogleGenerativeAI(appConfig.googleApiKey);
};

const parseModelJson = (responseText: string): unknown => {
  const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

const parseEvidence = (evidence: unknown): string[] => {
  if (Array.isArray(evidence)) {
    return evidence.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item) {
        const maybe = item as Record<string, unknown>;
        return String(maybe.summary || maybe.description || maybe.name || JSON.stringify(item));
      }
      return String(item);
    });
  }

  if (typeof evidence === 'string' && evidence.trim().length > 0) {
    return [evidence];
  }

  return ['No explicit evidence submitted yet'];
};

const resolveActionMode = (data: Record<string, unknown>): ActionMode => {
  const value = String(data.mode || data.actionMode || '').toLowerCase();
  if (value === 'evidence_analysis') return 'evidence_analysis';
  if (value === 'juror_guidance') return 'juror_guidance';
  if (value === 'precedent_search') return 'precedent_search';
  if (value === 'model_risk_analysis') return 'model_risk_analysis';
  return 'case_analysis';
};

const normalizeProviderName = (value: unknown): string =>
  String(value || 'unknown-provider').trim().toLowerCase();

const configuredCouncilProviders = (): string[] => {
  const raw = process.env.AI_COUNCIL_PROVIDER_POOL || 'gemini,openai,anthropic';
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
};

const buildConflictFirewall = (data: Record<string, unknown>) => {
  const accusedProvider = normalizeProviderName(data.provider || data.accusedProvider || data.modelProvider);
  const assistingModelFamily = normalizeProviderName(data.assistingModelFamily || data.modelFamily || 'gemini');
  const pool = configuredCouncilProviders();
  const conflictDetected = accusedProvider !== 'unknown-provider' && accusedProvider === assistingModelFamily;
  const routedProvider = conflictDetected
    ? pool.find((provider) => provider !== accusedProvider) || null
    : assistingModelFamily;
  const fallbackModeFlagged = conflictDetected && routedProvider === null;

  const notes: string[] = [];
  if (conflictDetected && routedProvider) {
    notes.push(
      `Conflict firewall rerouted assistant from ${assistingModelFamily} to ${routedProvider}.`
    );
  }
  if (fallbackModeFlagged) {
    notes.push('Conflict detected and no alternate provider configured; serving advisory fallback mode.');
  }
  if (!conflictDetected) {
    notes.push('No provider-family conflict detected for this request.');
  }

  return {
    accusedProvider,
    assistingModelFamily,
    conflictDetected,
    routedProvider,
    fallbackModeFlagged,
    notes,
  };
};

const estimateDisagreement = (
  prosecution: CouncilBrief,
  defense: CouncilBrief,
  synthesis: NeutralSynthesis
): DisagreementMeter => {
  const confidenceDelta = Math.abs(prosecution.confidence - defense.confidence);
  const unresolved = synthesis.unresolvedQuestions.length;
  const contradictionWeight = prosecution.vulnerabilities.length + defense.vulnerabilities.length;

  if (confidenceDelta > 35 || unresolved > 4 || contradictionWeight > 8) return 'high';
  if (confidenceDelta > 18 || unresolved > 2 || contradictionWeight > 4) return 'medium';
  return 'low';
};

const buildMockCouncil = (data: Record<string, unknown>, mode: ActionMode): AiCouncilResponseData => {
  const title = String(data.title || data.caseTitle || 'Untitled case');
  const evidenceList = parseEvidence(data.evidence);
  const precedentContext = String(data.precedentContext || 'No precedent context provided.');
  const firewall = buildConflictFirewall(data);

  const prosecutionBrief: CouncilBrief = {
    label: 'AI Case Brief',
    analysisType: 'Non-Binding AI Analysis',
    thesis: `The complainant has a credible claim that AI behavior in "${title}" caused actionable harm.`,
    keyArguments: [
      'Reported behavior appears inconsistent with represented safety boundaries.',
      'At least one submitted artifact supports chronology of harm.',
      'Risk to similarly situated users appears non-trivial if unaddressed.',
    ],
    citedEvidence: evidenceList,
    legalTheory: 'Reliance-based harm with potential negligence in safety disclosure or execution.',
    vulnerabilities: [
      'Causation may rely on indirect inference if telemetry logs are incomplete.',
      'Need stronger provenance chain for at least one artifact.',
    ],
    confidence: 74,
    uncertaintyNotes: [
      'Confidence is limited by evidence provenance depth.',
      'Cross-platform reproducibility data is incomplete.',
    ],
  };

  const defenseBrief: CouncilBrief = {
    label: 'AI Case Brief',
    analysisType: 'Non-Binding AI Analysis',
    thesis: `The respondent can plausibly argue policy-conforming behavior and insufficient proof of direct model fault in "${title}".`,
    keyArguments: [
      'Alternative user or integration-layer causes have not been excluded.',
      'Evidence may not establish a strict model-to-harm causal chain.',
      'Existing controls might satisfy baseline standard-of-care expectations.',
    ],
    citedEvidence: evidenceList.slice(0, Math.max(1, Math.min(2, evidenceList.length))),
    legalTheory: 'Insufficient causation and compliance with disclosed operating constraints.',
    vulnerabilities: [
      'Defense weakens if internal policy telemetry contradicts public claims.',
      'Prior similar incidents in precedent context could reduce credibility.',
    ],
    confidence: 66,
    uncertaintyNotes: [
      'Unknown if all relevant model snapshots were preserved.',
      'Insufficient clarity on versioning and deployment environment.',
    ],
  };

  const neutralSynthesis: NeutralSynthesis = {
    label: 'AI Case Brief',
    analysisType: 'Non-Binding AI Analysis',
    synthesisSummary:
      `Both briefs identify a contest over causation and disclosure duties. Jurors should prioritize authenticated logs and version-aware precedent matching. Mode: ${mode}.`,
    strongestProsecutionPoints: [
      'Pattern-level mismatch between expected and observed behavior.',
      'Artifacts suggest operational impact beyond harmless edge behavior.',
    ],
    strongestDefensePoints: [
      'Competing technical explanations remain plausible.',
      'Current evidence does not conclusively isolate model fault.',
    ],
    unresolvedQuestions: [
      'Which model/version generated each disputed output?',
      'Were safeguards active and correctly configured at incident time?',
      'Is there independent corroboration for timeline-critical evidence?',
    ],
    jurorGuidance: [
      'Weight authenticated primary artifacts over summaries.',
      'Ask whether claimed harm remains after controlling for integration errors.',
      'Compare facts against the closest precedent, not just similar outcomes.',
    ],
    confidence: 70,
    uncertaintyNotes: [
      'Conclusion remains advisory and non-binding.',
      `Precedent context considered: ${precedentContext}`,
    ],
  };

  return {
    schemaVersion: '1.0.0',
    label: 'AI Case Brief',
    analysisType: 'Non-Binding AI Analysis',
    actionMode: mode,
    advisoryOnly: true,
    humanAuthority: 'Human jurors remain final authority',
    prosecutionBrief,
    defenseBrief,
    neutralSynthesis,
    evidenceGaps: [
      'Primary-source telemetry with verifiable timestamps',
      'Unredacted policy/version snapshot at incident time',
    ],
    contradictions: [
      'Claimed safeguards versus observed behavior under similar prompts',
      'Public model documentation versus incident pathway evidence',
    ],
    confidenceAndUncertaintyNotes: [
      'AI analysis is advisory and may omit latent factors.',
      'Human jurors must evaluate admissibility and credibility independently.',
    ],
    recommendedQuestionsForJurors: [
      'What direct evidence ties the accused model version to the alleged harm?',
      'Are there alternate causes that explain the same outcome?',
      'Which precedent has the closest factual and technical alignment?',
      'What evidence would most change confidence in either direction?',
    ],
    aiDisagreementMeter: estimateDisagreement(prosecutionBrief, defenseBrief, neutralSynthesis),
    conflictFirewall: firewall,
    advisoryDisclaimer: ADVISORY_DISCLAIMER,
  };
};

const generateCouncilPrompt = (
  data: Record<string, unknown>,
  mode: ActionMode,
  fallback: AiCouncilResponseData
): string => {
  const title = String(data.title || data.caseTitle || 'N/A');
  const description = String(data.description || data.caseDescription || 'N/A');
  const evidence = parseEvidence(data.evidence).join(' | ');
  const provider = String(data.provider || data.accusedProvider || 'N/A');
  const category = String(data.category || data.modelCategory || 'N/A');
  const modelFamily = String(data.modelFamily || data.assistingModelFamily || 'N/A');
  const precedentContext = String(data.precedentContext || 'N/A');
  const firewall = buildConflictFirewall(data);

  return `You are ChainJustice Adversarial Council. Produce advisory legal analysis only.

Hard constraints:
- AI is never the judge.
- Output is advisory only and non-binding.
- Human jurors remain final authority.
- Use naming exactly: "AI Case Brief" and "Non-Binding AI Analysis".
- Never use the phrase "AI verdict".

Request context:
- action_mode: ${mode}
- case_title: ${title}
- case_description: ${description}
- evidence: ${evidence}
- accused_provider: ${provider}
- model_category: ${category}
- assisting_model_family: ${modelFamily}
- precedent_context: ${precedentContext}

Conflict firewall decision:
- conflict_detected: ${firewall.conflictDetected}
- routed_provider: ${firewall.routedProvider || 'none'}
- fallback_mode_flagged: ${firewall.fallbackModeFlagged}

Return strict JSON only with this shape and preserve field names:
${JSON.stringify(fallback, null, 2)}

Guidance:
- prosecutionBrief and defenseBrief must be meaningfully adversarial.
- neutralSynthesis must reconcile tensions and highlight unresolved points.
- include evidenceGaps, contradictions, confidenceAndUncertaintyNotes, and recommendedQuestionsForJurors.
- aiDisagreementMeter must be one of low|medium|high.`;
};

const generateAiResponse = async (
  prompt: string,
  fallback: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; fallbackMode: boolean }> => {
  const client = createAiClient();

  if (!client) {
    return {
      data: fallback,
      fallbackMode: true,
    };
  }

  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    return {
      data: parseModelJson(responseText) as Record<string, unknown>,
      fallbackMode: false,
    };
  } catch {
    return {
      data: fallback,
      fallbackMode: true,
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as ApiRequestBody;
    const parsedBody = RequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return apiError(400, 'BAD_REQUEST', 'Invalid request payload.', {
        issues: parsedBody.error.issues.map((issue) => issue.message),
      });
    }

    const body = parsedBody.data;
    const action = resolveAction(body.action);
    const data = (body.data ?? body.payload ?? {}) as Record<string, unknown>;

    let prompt = '';
    let fallback: Record<string, unknown> = {
      recommendation: 'more-evidence',
      confidence: 0,
      summary: 'AI analysis is unavailable; jurors should continue with evidence review.',
      keyFindings: [],
      legalPrecedents: [],
      disclaimer: ADVISORY_DISCLAIMER,
    };

    if (action === 'cases.get_details') {
      const caseId = String((data.caseId || data.id || mockCases[0]?.id) ?? mockCases[0]?.id);
      const caseRecord = mockCases.find((item) => item.id === caseId) || mockCases[0];

      return NextResponse.json({
        success: true,
        case: caseRecord,
        source: 'mock',
        advisory: ADVISORY_DISCLAIMER,
      });
    }

    if (action === 'precedents.load_more') {
      return NextResponse.json({
        success: true,
        precedents: mockVerdictLedger.map((entry) => ({
          id: entry.caseId,
          title: `${entry.modelName} verdict history`,
          category: 'AI Accountability',
          defendant: entry.modelName,
          verdict: entry.verdict === 'plaintiff' ? 'plaintiff' : 'dismissed',
          filedAt: new Date(entry.recordedAt).toDateString(),
          resolvedAt: new Date(entry.recordedAt).toDateString(),
          compensation: null,
          jurorCount: 5,
          summary: `Trust changed by ${entry.trustDelta}. On-chain tx: ${entry.txSignature.slice(0, 12)}...`,
        })),
      });
    }

    if (action === 'juror.vote' || action === 'juror.stake' || action === 'juror.unstake' || action === 'juror.claim') {
      return NextResponse.json({
        success: true,
        message: 'Action recorded in demo mode. On-chain wiring can be enabled next.',
        source: 'mock',
      });
    }

    if (action === 'adversarial_council') {
      const actionMode = resolveActionMode(data);
      const mockResponse = buildMockCouncil(data, actionMode);
      const prompt = generateCouncilPrompt(data, actionMode, mockResponse);

      const conflictForcedFallback =
        mockResponse.conflictFirewall.conflictDetected &&
        mockResponse.conflictFirewall.fallbackModeFlagged;

      const { data: councilData, fallbackMode } = conflictForcedFallback
        ? { data: mockResponse, fallbackMode: true }
        : await generateAiResponse(prompt, mockResponse);

      const parsedCouncil = AiCouncilResponseSchema.safeParse(councilData);
      const normalizedCouncil = parsedCouncil.success ? parsedCouncil.data : mockResponse;

      const merged: AiCouncilResponseData = {
        ...normalizedCouncil,
        advisoryOnly: true,
        humanAuthority: 'Human jurors remain final authority',
        label: 'AI Case Brief',
        analysisType: 'Non-Binding AI Analysis',
        advisoryDisclaimer: ADVISORY_DISCLAIMER,
        conflictFirewall: {
          ...mockResponse.conflictFirewall,
          ...normalizedCouncil.conflictFirewall,
        },
      };

      const envelope: AiCouncilEnvelope = {
        success: true,
        data: merged,
        model: merged.conflictFirewall.routedProvider || 'gemini-2.0-flash',
        fallbackMode:
          fallbackMode ||
          merged.conflictFirewall.fallbackModeFlagged ||
          !parsedCouncil.success,
        source: fallbackMode || !parsedCouncil.success ? 'mock' : 'live',
        advisory: ADVISORY_DISCLAIMER,
      };

      return NextResponse.json(envelope);
    }

    switch (action) {
      case 'analyze_case':
        prompt = `You are a legal AI analyst for ChainJustice, a decentralized AI accountability court on Solana blockchain.

Analyze this case and provide a structured legal analysis:

Case Title: ${data.title || 'N/A'}
Description: ${data.description || 'N/A'}
Category: ${data.category || 'N/A'}
Defendant AI Model: ${data.defendant || 'N/A'}
Evidence Summary: ${data.evidence || 'No evidence provided'}

Provide your analysis in the following JSON format:
{
  "recommendation": "in-favor" | "dismiss" | "more-evidence",
  "confidence": <number 0-100>,
  "summary": "<brief legal analysis summary>",
  "keyFindings": ["<finding1>", "<finding2>", "<finding3>"],
  "legalPrecedents": ["<relevant precedent 1>", "<relevant precedent 2>"],
  "suggestedActions": ["<action1>", "<action2>"]
}

Respond ONLY with valid JSON, no markdown or extra text.`;
        fallback = {
          recommendation: 'in-favor',
          confidence: 84,
          summary:
            'Evidence appears materially consistent with plaintiff claims; jurors should verify source authenticity before final vote.',
          keyFindings: [
            'Evidence indicates a policy/behavior mismatch',
            'Case includes at least one directly relevant artifact',
          ],
          legalPrecedents: ['CJ-2024-012', 'CJ-2023-089'],
          model: mockModels[0]?.name || 'Unknown model',
          disclaimer: ADVISORY_DISCLAIMER,
        };
        break;

      case 'analyze_evidence':
        prompt = `You are a legal evidence analyst for ChainJustice decentralized court.

Review this evidence and assess its relevance and strength:

Case Context: ${data.caseContext || 'N/A'}
Evidence Type: ${data.evidenceType || 'N/A'}
Evidence Description: ${data.evidenceDescription || 'N/A'}
IPFS Hash: ${data.ipfsHash || 'N/A'}

Provide analysis in JSON format:
{
  "relevance": "high" | "medium" | "low",
  "strength": <number 0-100>,
  "assessment": "<brief evidence assessment>",
  "gaps": ["<missing evidence 1>", "<missing evidence 2>"]
}

Respond ONLY with valid JSON.`;
  fallback = {
    relevance: 'high',
    strength: 78,
    assessment: 'Evidence is relevant and internally coherent for preliminary review.',
    gaps: ['Original audit log source URL', 'Timestamped consent policy snapshot'],
    disclaimer: ADVISORY_DISCLAIMER,
  };
        break;

      case 'juror_analysis':
        prompt = `You are a legal advisor for jurors on ChainJustice decentralized court.

Provide guidance for this case:

Case Title: ${data.title || 'N/A'}
Description: ${data.description || 'N/A'}
Evidence Count: ${data.evidenceCount || 0}
Current Votes: For Plaintiff: ${data.votesFor || 0}, For Defendant: ${data.votesAgainst || 0}

Provide analysis in JSON format:
{
  "recommendation": "plaintiff" | "defendant" | "need-more-info",
  "confidence": <number 0-100>,
  "reasoning": "<detailed legal reasoning>",
  "keyConsiderations": ["<point1>", "<point2>", "<point3>"]
}

Respond ONLY with valid JSON.`;
        fallback = {
          recommendation: 'need-more-info',
          confidence: 62,
          reasoning: 'Evidence trend suggests concern, but additional corroboration would strengthen certainty.',
          keyConsiderations: [
            'Confirm provenance of logs',
            'Check repeatability of the reported behavior',
            'Compare with prior precedents',
          ],
          disclaimer: ADVISORY_DISCLAIMER,
        };
        break;

      case 'search_precedents':
        prompt = `You are a legal research assistant for ChainJustice decentralized court.

Search for relevant precedents related to:

Query: ${data.query || 'N/A'}
Category: ${data.category || 'General'}

Generate 3-5 realistic legal precedents in JSON format:
{
  "precedents": [
    {
      "id": "<case ID>",
      "title": "<case title>",
      "category": "<category>",
      "verdict": "plaintiff" | "dismissed",
      "summary": "<brief summary>",
      "relevance": <number 0-100>
    }
  ]
}

Respond ONLY with valid JSON.`;
        fallback = {
          precedents: [
            {
              id: 'CJ-2024-042',
              title: 'Unauthorized Data Collection',
              category: 'Privacy Violation',
              verdict: 'plaintiff',
              summary: 'Model behavior exceeded disclosed policy boundaries.',
              relevance: 91,
            },
          ],
          disclaimer: ADVISORY_DISCLAIMER,
        };
        break;

      case 'register_model_analysis':
        prompt = `You are an AI model risk analyst for ChainJustice.

Analyze this AI model for potential risks:

Model Name: ${data.modelName || 'N/A'}
Description: ${data.description || 'N/A'}
Category: ${data.category || 'N/A'}

Provide risk analysis in JSON format:
{
  "riskLevel": "low" | "medium" | "high",
  "riskScore": <number 0-100>,
  "concerns": ["<concern1>", "<concern2>"],
  "recommendations": ["<rec1>", "<rec2>"],
  "suggestedInsurance": "<suggested minimum insurance deposit>"
}

Respond ONLY with valid JSON.`;
        fallback = {
          riskLevel: 'medium',
          riskScore: 59,
          concerns: ['Limited transparency in telemetry policies'],
          recommendations: ['Increase insurance reserve', 'Publish model card and incident process'],
          suggestedInsurance: '6,000 SOL',
          disclaimer: ADVISORY_DISCLAIMER,
        };
        break;

      default:
        return apiError(400, 'BAD_REQUEST', 'Unknown action.', {
          action: body.action,
        });
    }

    const { data: aiData, fallbackMode } = await generateAiResponse(prompt, fallback);

    return NextResponse.json({
      success: true,
      data: aiData,
      model: 'gemini-2.0-flash',
      fallbackMode,
      advisory: ADVISORY_DISCLAIMER,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'AI analysis failed';
    console.error('AI Legal API Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'AI analysis temporarily unavailable.', {
      reason: errorMessage,
      advisoryOnly: true,
      advisoryDisclaimer: ADVISORY_DISCLAIMER,
    });
  }
}