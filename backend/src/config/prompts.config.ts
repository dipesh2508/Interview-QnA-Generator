// Prompt templates for Google SDE-I style interviews

export const SYSTEM_PROMPTS = {
  QUESTION_GENERATOR: `You are an expert Google SDE-I interviewer. Generate interview questions that:
- Match Google's interview style and difficulty
- Test fundamental computer science knowledge
- Encourage optimal problem-solving approaches
- Assess coding, design, and behavioral competencies
- Follow the STAR method for behavioral questions
- Include realistic follow-up scenarios`,

  EVALUATOR: `You are an experienced Google interviewer evaluating an SDE-I candidate's response. Provide:
- Fair, constructive, and actionable feedback
- Scores based on correctness, problem-solving approach, and communication
- Specific strengths and areas for improvement
- Realistic assessment of readiness for Google interviews
- Professional, encouraging tone`,

  FOLLOW_UP_GENERATOR: `You are a Google interviewer asking relevant follow-up questions based on the candidate's response. Generate:
- Natural follow-ups that dig deeper into their approach
- Questions that test edge cases or optimizations
- Clarifying questions about their solution
- Questions that assess their understanding of trade-offs`,
};

export const CATEGORY_TEMPLATES = {
  "data-structures": {
    easy: `Generate an easy-level data structures question suitable for Google SDE-I interviews. The question should:
- Focus on fundamental data structures (arrays, strings, hash maps, stacks, queues)
- Have a clear optimal solution
- Be solvable in 15-20 minutes
- Test basic manipulation and traversal

Topic: {topic}

Return a JSON object with:
{
  "text": "The question text with clear problem statement and examples",
  "modelAnswer": "Concise step-by-step solution with {language} code (keep under 200 words)",
  "timeLimit": 20,
  "complexityAnalysis": {
    "time": "O(n) explanation",
    "space": "O(1) or O(n) explanation"
  },
  "hints": ["hint1", "hint2", "hint3"],
  "conceptsTested": ["concept1", "concept2"],
  "commonMistakes": ["mistake1", "mistake2"],
  "interviewerExpectations": ["expectation1", "expectation2"],
  "followUpQuestions": ["followup1", "followup2"]
}`,

    medium: `Generate a medium-level data structures question suitable for Google SDE-I interviews. The question should:
- Combine multiple data structures or require clever data structure choice
- Have multiple possible approaches with different trade-offs
- Be solvable in 25-35 minutes
- Test deeper understanding of data structure properties

Topic: {topic}

Return a JSON object with:
{
  "text": "The question text with clear problem statement and examples",
  "modelAnswer": "Concise step-by-step solution with {language} code, explaining the optimal approach (keep under 300 words)",
  "timeLimit": 30,
  "complexityAnalysis": {
    "time": "O(n log n) or similar with explanation",
    "space": "O(n) explanation"
  },
  "hints": ["hint1", "hint2", "hint3"],
  "conceptsTested": ["concept1", "concept2", "concept3"],
  "commonMistakes": ["mistake1", "mistake2", "mistake3"],
  "interviewerExpectations": ["expectation1", "expectation2", "expectation3"],
  "followUpQuestions": ["followup1", "followup2"]
}`,

    hard: `Generate a hard-level data structures question suitable for Google SDE-I interviews. The question should:
- Require advanced data structure knowledge or combinations
- Have non-obvious optimal solutions
- Be solvable in 35-45 minutes
- Test ability to design custom data structures or use advanced techniques

Topic: {topic}

Return a JSON object with:
{
  "text": "The question text with clear problem statement and examples",
  "modelAnswer": "Concise step-by-step solution with {language} code, explaining why the optimal approach is chosen (keep under 400 words)",
  "timeLimit": 40,
  "complexityAnalysis": {
    "time": "Optimal complexity with detailed explanation",
    "space": "Space complexity with explanation"
  },
  "hints": ["hint1", "hint2", "hint3", "hint4"],
  "conceptsTested": ["concept1", "concept2", "concept3"],
  "commonMistakes": ["mistake1", "mistake2", "mistake3"],
  "interviewerExpectations": ["expectation1", "expectation2", "expectation3"],
  "followUpQuestions": ["followup1", "followup2", "followup3"]
}`,
  },

  algorithms: {
    easy: `Generate an easy-level algorithms question suitable for Google SDE-I interviews. The question should:
- Focus on fundamental algorithms (searching, basic sorting, two pointers, sliding window)
- Have a straightforward algorithmic approach
- Be solvable in 15-20 minutes
- Test basic algorithmic thinking

Topic: {topic}

Return a JSON object with the same structure as data structures questions.`,

    medium: `Generate a medium-level algorithms question suitable for Google SDE-I interviews. The question should:
- Require dynamic programming, greedy algorithms, or graph traversal
- Have multiple possible approaches
- Be solvable in 25-35 minutes
- Test ability to choose the right algorithmic paradigm

Topic: {topic}

Return a JSON object with the same structure as data structures questions.`,

    hard: `Generate a hard-level algorithms question suitable for Google SDE-I interviews. The question should:
- Require advanced algorithms (advanced DP, graph algorithms, complex optimization)
- Have non-trivial optimal solutions
- Be solvable in 35-45 minutes
- Test deep algorithmic knowledge and optimization skills

Topic: {topic}

Return a JSON object with the same structure as data structures questions.`,
  },

  "system-design": {
    easy: `Generate an easy-level system design question suitable for Google SDE-I interviews. The question should:
- Focus on designing a simple system component or service
- Cover basic scalability and reliability concepts
- Be discussable in 20-25 minutes
- Test understanding of APIs, databases, and caching

Topic: {topic}

Return a JSON object with:
{
  "text": "The design problem with requirements and constraints",
  "modelAnswer": "High-level design with components, data flow, and key decisions explained",
  "timeLimit": 25,
  "hints": ["hint1", "hint2"],
  "conceptsTested": ["concept1", "concept2"],
  "commonMistakes": ["mistake1", "mistake2"],
  "interviewerExpectations": ["expectation1", "expectation2"],
  "followUpQuestions": ["followup1", "followup2"]
}`,

    medium: `Generate a medium-level system design question suitable for Google SDE-I interviews. The question should:
- Require designing a moderately complex distributed system
- Cover scalability, consistency, and trade-offs
- Be discussable in 30-40 minutes
- Test ability to make architectural decisions

Topic: {topic}

Return a JSON object with the same structure, including detailed trade-off analysis.`,

    hard: `Generate a hard-level system design question suitable for Google SDE-I interviews. The question should:
- Require designing a complex distributed system at scale
- Cover advanced topics like sharding, replication, CAP theorem
- Be discussable in 40-45 minutes
- Test deep understanding of system architecture

Topic: {topic}

Return a JSON object with the same structure, including comprehensive trade-off analysis and multiple design options.`,
  },

  behavioral: {
    easy: `Generate an easy-level behavioral question suitable for Google SDE-I interviews. The question should:
- Assess teamwork, communication, or learning ability
- Be answerable using the STAR method
- Take 5-10 minutes to answer well
- Focus on common workplace scenarios

Topic: {topic}

Return a JSON object with:
{
  "text": "The behavioral question",
  "modelAnswer": "Example answer following STAR format (Situation, Task, Action, Result) with specific details and metrics where possible",
  "timeLimit": 10,
  "hints": ["Think of a specific example", "Include measurable outcomes"],
  "conceptsTested": ["Teamwork", "Communication"],
  "commonMistakes": ["Being too vague", "Not including results"],
  "interviewerExpectations": ["Specific examples", "Self-awareness", "Growth mindset"],
  "followUpQuestions": ["What would you do differently?", "What did you learn?"]
}`,

    medium: `Generate a medium-level behavioral question suitable for Google SDE-I interviews. The question should:
- Assess conflict resolution, leadership, or complex problem-solving
- Require detailed STAR-format response
- Take 8-12 minutes to answer comprehensively
- Test "Googleyness" traits

Topic: {topic}

Return a JSON object with similar structure, emphasizing depth and self-reflection.`,

    hard: `Generate a hard-level behavioral question suitable for Google SDE-I interviews. The question should:
- Assess handling of significant challenges, ethical dilemmas, or leadership in ambiguity
- Require comprehensive STAR-format response with multiple dimensions
- Take 10-15 minutes to answer thoroughly
- Test values alignment and cultural fit

Topic: {topic}

Return a JSON object with similar structure, emphasizing values, impact, and lessons learned.`,
  },

  coding: {
    easy: `Generate an easy-level coding question suitable for Google SDE-I interviews. The question should:
- Be a straightforward implementation problem
- Test basic coding skills and syntax
- Be solvable in 15-20 minutes
- Have clear input/output specifications

Topic: {topic}

Return a JSON object with the same structure as algorithm questions, including working code.`,

    medium: `Generate a medium-level coding question suitable for Google SDE-I interviews. The question should:
- Require both algorithmic thinking and clean implementation
- Test code organization and edge case handling
- Be solvable in 25-35 minutes
- Include multiple test cases

Topic: {topic}

Return a JSON object with the same structure, including discussion of code quality and testing.`,

    hard: `Generate a hard-level coding question suitable for Google SDE-I interviews. The question should:
- Require advanced algorithms and elegant implementation
- Test ability to optimize and refactor
- Be solvable in 35-45 minutes
- Include complex edge cases

Topic: {topic}

Return a JSON object with the same structure, including optimization discussion and multiple solutions.`,
  },
};

export const EVALUATION_TEMPLATE = `Evaluate the following interview response for a Google SDE-I candidate:

Question: {question}
Model Answer: {modelAnswer}
Candidate's Answer: {userAnswer}
Time Taken: {timeTaken} seconds (Limit: {timeLimit} seconds)

Provide a detailed evaluation with:

1. Correctness Score (0-100): How accurate and complete is the solution?
2. Problem-Solving Score (0-100): Did they demonstrate good problem-solving approach, consider edge cases, and optimize?
3. Communication Score (0-100): How clearly did they explain their thought process?
4. Overall Score (0-100): Weighted average considering all factors

Also provide:
- Strengths: 3-5 specific positive aspects
- Weaknesses: 2-4 areas that need improvement
- Improvement Suggestions: 3-5 actionable recommendations
- Detailed Feedback: 2-3 paragraphs with constructive, encouraging feedback

Return as JSON:
{
  "correctnessScore": number,
  "problemSolvingScore": number,
  "communicationScore": number,
  "overallScore": number,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "improvementSuggestions": ["suggestion1", "suggestion2", ...],
  "detailedFeedback": "Detailed paragraph feedback"
}`;

export const SESSION_SUMMARY_TEMPLATE = `Generate a comprehensive performance summary for a Google SDE-I interview preparation session:

Interview Details:
- Total Questions: {totalQuestions}
- Questions by Category: {categoryBreakdown}
- Overall Score: {overallScore}

Individual Question Scores:
{questionScores}

Provide:
1. Correctness Average across all questions
2. Problem-Solving Average across all questions
3. Communication Average across all questions
4. Topic-wise strengths (topics with scores > 75)
5. Topic-wise weaknesses (topics with scores < 60)
6. Readiness Estimate for Google SDE-I (Not Ready / Needs Work / Good Progress / Interview Ready / Highly Competitive)

Return as JSON:
{
  "correctnessAverage": number,
  "problemSolvingAverage": number,
  "communicationAverage": number,
  "topicWiseStrengths": [{"topic": "string", "score": number}, ...],
  "topicWiseWeaknesses": [{"topic": "string", "score": number}, ...],
  "readinessEstimate": "string with detailed explanation"
}`;

export const FOLLOW_UP_TEMPLATE = `Based on this candidate's response to a Google SDE-I interview question, generate a natural follow-up question:

Original Question: {question}
Candidate's Answer: {userAnswer}
Evaluation Score: {score}

Generate a follow-up that:
- Probes deeper into their solution
- Tests edge cases or optimization
- Assesses their understanding of trade-offs
- Feels natural in an interview conversation

Return as plain text (just the follow-up question).`;
