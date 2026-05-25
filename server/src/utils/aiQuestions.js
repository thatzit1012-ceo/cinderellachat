const Anthropic = require('@anthropic-ai/sdk');

const PROMPT = (date) => `오늘 날짜: ${date}

Cinderella Chat은 K-컬처에 관심 있는 전 세계 유저들이 연애/관계 가치관 질문으로 방을 배정받아 익명 채팅하는 서비스입니다.

오늘의 채팅방 매칭에 사용할 질문 3개를 만들어주세요.

조건:
- 연애, 관계, 사랑, 가치관 관련 주제 (날짜마다 신선한 주제)
- 각 질문은 서로 다른 각도의 주제
- 선택지 A, B는 서로 대립되는 관점
- 재치 있고 대화를 유발하는 자연스러운 문장
- 한국어 + 영어 동시 제공
- JSON 배열만 응답 (설명 없이)

응답 형식:
[
  {
    "id": "q1",
    "text_ko": "질문 한국어",
    "text_en": "Question in English",
    "options": [
      { "code": "A", "text_ko": "선택지A 한국어", "text_en": "Option A English" },
      { "code": "B", "text_ko": "선택지B 한국어", "text_en": "Option B English" },
      { "code": "X", "text_ko": "이 질문에는 답변 없음", "text_en": "No answer for this question" }
    ]
  }
]`;

async function generateDailyQuestions(date) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: PROMPT(date) }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON array');

  const questions = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Invalid questions format from Claude');
  }

  // q1, q2, q3 id 보정
  return questions.map((q, i) => ({ ...q, id: `q${i + 1}` }));
}

module.exports = { generateDailyQuestions };
