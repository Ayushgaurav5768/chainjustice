import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    let prompt = '';

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
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown action.' },
          { status: 400 }
        );
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsedResponse;
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleaned);
    } catch {
      parsedResponse = { raw: responseText };
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse,
      model: 'gemini-2.0-flash',
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'AI analysis failed';
    console.error('AI Legal API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        fallback: {
          recommendation: "more-evidence",
          confidence: 0,
          summary: "AI analysis temporarily unavailable. Please try again later.",
          keyFindings: [],
          legalPrecedents: []
        }
      },
      { status: 500 }
    );
  }
}