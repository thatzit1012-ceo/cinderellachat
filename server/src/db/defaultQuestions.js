// 관리자가 질문을 등록하지 않았을 때 사용하는 디폴트 질문 세트
const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    text_ko: '만약에 내 연인이 다 좋은데, 가난해...당신의 선택은?',
    text_en: 'Your partner is great in every way, but poor. What do you choose?',
    options: [
      { code: 'A', text_ko: '난 오케이, 사랑만 있다면 극복 가능하다.', text_en: "I'm okay, love can overcome anything." },
      { code: 'B', text_ko: '말도 안된다. 지금 세상은 돈 없으면 사랑도 오래 못간다.', text_en: "No way. In today's world, love can't last without money." },
      { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
    ],
  },
  {
    id: 'q2',
    text_ko: '처음 만났다. 근데 맘에 든다. 어디까지는 오케이?',
    text_en: "You just met someone and you like them. How far is okay on the first meeting?",
    options: [
      { code: 'A', text_ko: '내 짝이라면, 첫 만남에 키스도 가능하다고 생각한다.', text_en: "If they're the one, a kiss on the first meeting is fine." },
      { code: 'B', text_ko: '그래도 처음인데, 그건 아니다. 손 잡는 정도까지...', text_en: "Still the first time — holding hands is the limit." },
      { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
    ],
  },
  {
    id: 'q3',
    text_ko: '키스를 할때, 내 역할은?',
    text_en: 'When kissing, what is your role?',
    options: [
      { code: 'A', text_ko: '리드를 하는 편이다.', text_en: 'I tend to take the lead.' },
      { code: 'B', text_ko: '상대에게 맡기는 편이다.', text_en: 'I tend to let the other person lead.' },
      { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
    ],
  },
];

module.exports = { DEFAULT_QUESTIONS };
