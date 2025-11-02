/**
 * Query complexity analyzer using heuristics and optional embeddings
 */

import { ComplexityAnalysis, ComplexityLevel } from '../types';

export class ComplexityAnalyzer {
  /**
   * Analyze query complexity using multiple signals
   */
  async analyze(query: string): Promise<ComplexityAnalysis> {
    // Tier 1: Rule-based heuristics (fast, ~1ms)
    const heuristicAnalysis = this.analyzeWithHeuristics(query);

    // Tier 2: Embeddings-based analysis (optional, ~50ms)
    // For now, we'll use heuristics only
    // In production, you'd add: const embeddingScore = await this.analyzeWithEmbeddings(query);

    return heuristicAnalysis;
  }

  /**
   * Heuristic-based complexity analysis
   */
  private analyzeWithHeuristics(query: string): ComplexityAnalysis {
    const factors = {
      length: query.length,
      hasCode: this.detectCode(query),
      hasMath: this.detectMath(query),
      questionType: this.classifyQuestionType(query),
      keywords: this.extractComplexityKeywords(query),
      sentenceComplexity: this.calculateSentenceComplexity(query),
    };

    // Calculate complexity score (0-100)
    let score = 0;

    // Length factor (0-20 points)
    if (factors.length < 50) score += 5;
    else if (factors.length < 150) score += 10;
    else if (factors.length < 300) score += 15;
    else score += 20;

    // Code/Math detection (0-20 points)
    if (factors.hasCode) score += 15;
    if (factors.hasMath) score += 10;

    // Question type (0-25 points)
    if (factors.questionType === 'simple') score += 5;
    else if (factors.questionType === 'complex') score += 15;
    else if (factors.questionType === 'reasoning') score += 25;

    // Keywords (0-25 points) - increased weight
    score += Math.min(factors.keywords.length * 5, 25);

    // Sentence complexity (0-15 points)
    score += Math.min(factors.sentenceComplexity * 3, 15);
    
    // Multiple issues bonus (0-10 points)
    // Detect if query mentions multiple problems/issues
    const issueIndicators = ['also', 'and', 'but', 'however', 'additionally'];
    const hasMultipleIssues = issueIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    ) && factors.keywords.length >= 3;
    if (hasMultipleIssues) score += 10;

    // Determine level based on score
    let level: ComplexityLevel;
    if (score < 25) level = 'simple';
    else if (score < 50) level = 'moderate';
    else if (score < 75) level = 'complex';
    else level = 'reasoning';

    // Generate reasoning explanation
    const reasoning = this.generateReasoning(level, factors, score);

    return {
      level,
      score,
      factors,
      reasoning,
    };
  }

  /**
   * Detect code blocks in query
   */
  private detectCode(query: string): boolean {
    const codePatterns = [
      /```[\s\S]*?```/, // Markdown code blocks
      /`[^`]+`/, // Inline code
      /function\s+\w+\s*\(/, // Function definitions
      /class\s+\w+/, // Class definitions
      /const\s+\w+\s*=/, // Variable declarations
      /import\s+.*from/, // Import statements
      /(if|for|while)\s*\(/, // Control structures
    ];

    return codePatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Detect mathematical content
   */
  private detectMath(query: string): boolean {
    const mathPatterns = [
      /\d+\s*[+\-*/]\s*\d+/, // Basic arithmetic
      /[∑∏∫∂√]/u, // Mathematical symbols
      /\b(equation|formula|calculate|solve|proof)\b/i,
      /x\^?\d+/, // Variables with exponents
      /\b(sin|cos|tan|log|ln)\b/, // Math functions
    ];

    return mathPatterns.some((pattern) => pattern.test(query));
  }

  /**
   * Classify question type
   */
  private classifyQuestionType(
    query: string
  ): 'simple' | 'complex' | 'reasoning' {
    const lowerQuery = query.toLowerCase();

    // Simple question patterns
    const simplePatterns = [
      /^(what|when|where|who)\s+is\s+/,
      /^how\s+do\s+i\s+/,
      /\b(hours|policy|return|reset|password)\b/,
    ];

    // Reasoning patterns
    const reasoningPatterns = [
      /\b(should\s+i|recommend|decide|compare|analyze|evaluate)\b/,
      /\b(best\s+approach|optimal|strategy)\b/,
      /\b(consider|given\s+that|taking\s+into\s+account)\b/,
      /\b(multiple|several)\s+.{0,50}\s+(options|factors|considerations)\b/,
    ];

    // Complex patterns
    const complexPatterns = [
      /\b(explain|describe|how\s+does|why|difference\s+between)\b/,
      /\b(implement|integrate|configure)\b/,
      /\b(troubleshoot|investigate|diagnose)\b/,
    ];

    if (reasoningPatterns.some((p) => p.test(lowerQuery)))
      return 'reasoning';
    if (complexPatterns.some((p) => p.test(lowerQuery))) return 'complex';
    if (simplePatterns.some((p) => p.test(lowerQuery))) return 'simple';

    // Default to complex if ambiguous
    return 'complex';
  }

  /**
   * Extract complexity-indicating keywords
   */
  private extractComplexityKeywords(query: string): string[] {
    const complexityKeywords = [
      'explain',
      'analyze',
      'compare',
      'evaluate',
      'implement',
      'integrate',
      'troubleshoot',
      'optimize',
      'architecture',
      'algorithm',
      'performance',
      'security',
      'scalability',
      'reasoning',
      'strategy',
      'recommend',
      'investigate',
      'diagnose',
      'resolve',
      'dispute',
      'complaint',
      'issue',
      'problem',
      'charged',
      'refund',
      'subscription',
      'unauthorized',
      'consent',
    ];

    const lowerQuery = query.toLowerCase();
    return complexityKeywords.filter((keyword) =>
      lowerQuery.includes(keyword)
    );
  }

  /**
   * Calculate sentence complexity
   */
  private calculateSentenceComplexity(query: string): number {
    const sentences = query.split(/[.!?]+/).filter((s) => s.trim());
    if (sentences.length === 0) return 0;

    let totalComplexity = 0;

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).length;
      const commas = (sentence.match(/,/g) || []).length;
      const conjunctions = (
        sentence.match(/\b(and|but|or|because|however|therefore)\b/gi) ||
        []
      ).length;

      // Complexity = words per sentence + clauses (indicated by commas and conjunctions)
      const sentenceComplexity = words / 10 + commas + conjunctions;
      totalComplexity += sentenceComplexity;
    }

    return Math.round(totalComplexity / sentences.length);
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    level: ComplexityLevel,
    factors: ComplexityAnalysis['factors'],
    score: number
  ): string {
    const reasons: string[] = [];

    // Length reasoning
    if (factors.length < 50) {
      reasons.push('Short query (quick answer expected)');
    } else if (factors.length > 200) {
      reasons.push('Long query (detailed context provided)');
    }

    // Code/Math reasoning
    if (factors.hasCode) {
      reasons.push('Contains code (technical assistance needed)');
    }
    if (factors.hasMath) {
      reasons.push('Contains math (numerical reasoning required)');
    }

    // Question type reasoning
    if (factors.questionType === 'simple') {
      reasons.push('Simple factual question');
    } else if (factors.questionType === 'complex') {
      reasons.push('Complex explanation or implementation required');
    } else if (factors.questionType === 'reasoning') {
      reasons.push('Requires decision-making or strategic thinking');
    }

    // Keywords reasoning
    if (factors.keywords.length > 0) {
      reasons.push(
        `Complexity keywords: ${factors.keywords.slice(0, 3).join(', ')}`
      );
    }

    // Final assessment
    const levelDescriptions = {
      simple: 'Straightforward query, suitable for fast models',
      moderate: 'Moderately complex, requires capable model',
      complex: 'Complex query, needs advanced reasoning',
      reasoning:
        'Requires deep reasoning and multi-step problem solving',
    };

    return `${levelDescriptions[level]}. ${reasons.join('. ')}.`;
  }
}
