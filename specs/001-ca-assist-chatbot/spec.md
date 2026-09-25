# Feature Specification: CA Assist Chatbot

**Feature Branch**: not assigned

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Create a specification for the CA Assist chatbot described in the attached PRD."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get General CA Information (Priority: P1)

As an individual or small-business owner in India, I want to ask a tax or accounting question so
that I can get clear general information.

**Why this priority**: Answering in-scope CA questions is the product's primary value.

**Independent Test**: After live responses are approved, ask one of the supported questions in a
new conversation, review the answer for relevance and general-information framing, then ask a
follow-up to check that the conversation remains coherent.

**Acceptance Scenarios**:

1. **Given** live responses are approved and a new conversation, **When** the user asks
  "What is the ITR filing due date for salaried individuals?", **Then** the assistant provides a
  relevant general-information answer and the persistent disclaimer is visible.
2. **Given** live responses are approved and an earlier question and answer, **When** the user
  asks a related follow-up, **Then** the assistant uses the preceding conversation to respond
  coherently without presenting the answer as personalized professional advice.
3. **Given** a non-empty question, **When** the user selects Send or presses Enter, **Then** the
   question appears in the conversation and is submitted once.

---

### User Story 2 - Stay Within CA Topics (Priority: P1)

As a user, I want unrelated questions redirected politely so that the assistant remains focused
on Indian tax and accounting.

**Why this priority**: Clear boundaries reduce misleading or irrelevant answers.

**Independent Test**: After live responses are approved, ask an unrelated question, such as a recipe
request, and verify that the assistant redirects to supported CA topics rather than answering it.

**Acceptance Scenarios**:

1. **Given** live responses are approved and a question unrelated to CA topics, **When** the user
  submits it, **Then** the assistant politely declines that request and redirects to Indian tax,
  GST, TDS, ITR filing, or accounting.
2. **Given** a message containing both a supported and an unrelated request, **When** the user
   submits it, **Then** the assistant addresses only the supported portion and redirects the rest.

---

### User Story 3 - Understand Waiting and Recover From Errors (Priority: P2)

As a user, I want clear status and recovery guidance so that a slow or failed response does not
leave me uncertain about what to do.

**Why this priority**: Reliable feedback makes the core question-and-answer flow usable when the
response service is slow or unavailable.

**Independent Test**: After live responses are approved, observe a pending response, then simulate
a service failure, a response that takes more than 30 seconds, and a rate limit; verify each result.

**Acceptance Scenarios**:

1. **Given** a submitted question awaiting a response, **When** the response is pending, **Then**
   the interface displays a clear thinking indicator.
2. **Given** a service failure or a response that exceeds 30 seconds, **When** the request ends,
   **Then** the interface shows a safe, understandable error and a Retry action.
3. **Given** the service reports that requests are rate-limited, **When** the user submits a
   question, **Then** the interface explains that the user should retry later.
4. **Given** live responses have not been approved by the project owner, **When** the user attempts
   to submit a question, **Then** no live request is made and the interface explains that responses
   are not yet enabled.

---

### User Story 4 - Read and Manage a Conversation (Priority: P2)

As a user, I want readable replies and a way to start over so that I can follow the answer and keep
a new question separate.

**Why this priority**: Readability, accessibility, and conversation control support users across
devices and abilities.

**Independent Test**: Review a reply containing structured content, use New chat, and repeat the
flow on mobile and with keyboard-only navigation.

**Acceptance Scenarios**:

1. **Given** an assistant reply with lists, emphasis, or a table, **When** it is displayed, **Then**
   its structure remains readable.
2. **Given** a conversation with messages, **When** the user selects New chat, **Then** the
   messages and conversational context are cleared and a blank conversation is shown.
3. **Given** a mobile or desktop screen, **When** the user navigates the core flow with a keyboard
   or screen reader, **Then** controls remain usable, focus is visible, new replies are announced,
   and the disclaimer remains visible.
4. **Given** the user starts a fresh page session, **When** they open CA Assist, **Then** no prior
    conversation is restored and no login, saved-history, upload, or streaming interaction is offered.

### Edge Cases

- Empty or whitespace-only input is not submitted.
- If the assistant cannot verify a current tax fact, it states that the information needs checking
  and recommends consulting a qualified CA rather than guessing.
- A mixed in-scope and off-topic request receives an answer only for the in-scope portion.
- A retry after failure does not silently discard the user's question.
- Selecting New chat while a response is pending does not restore the cleared conversation when
  that response later arrives.
- Before live-response approval, no question or credential is sent to the response service.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to submit a non-empty question using Send or Enter. Empty input
  MUST NOT be submitted.
- **FR-002**: The assistant MUST answer general questions about Indian income tax, GST, TDS, ITR
  filing, and accounting, without presenting responses as personalized professional advice.
- **FR-003**: The assistant MUST use the current conversation when responding to follow-up questions.
- **FR-004**: The assistant MUST politely redirect unrelated requests and MUST NOT answer their
  unrelated content. For mixed requests, it MUST address only the supported portion.
- **FR-005**: Every screen MUST keep this exact disclaimer visible: "For general information only.
  Consult a qualified CA for advice."
- **FR-006**: The interface MUST show a clear thinking indicator while a response is pending.
- **FR-007**: A failed request or a request that exceeds 30 seconds MUST show a safe error and a
  Retry action.
- **FR-008**: A rate-limited request MUST show a clear message that explains the user can retry later.
- **FR-009**: Replies MUST preserve readable structure for lists, bold emphasis, and tables.
- **FR-010**: New chat MUST clear the visible messages and conversational context. The product MUST
  NOT restore a previous conversation after it has been cleared or the page session ends.
- **FR-011**: The interface MUST work on mobile and desktop, support keyboard navigation with
  visible focus, and announce new replies to screen-reader users.
- **FR-012**: Live responses MUST remain disabled until the project owner explicitly accepts browser
  credential exposure and confirms the intended credential restrictions. Before approval, the
  interface MUST explain that live responses are unavailable and MUST NOT send questions or expose
  credentials.
- **FR-013**: The product MUST NOT require user login, retain chat history across sessions, accept
  file or document uploads, or provide streaming responses.

### Key Entities *(include if feature involves data)*

- **Conversation**: The ordered exchange of user questions and assistant replies in the current
  page session; it has no account identity or cross-session history.
- **User Question**: Text submitted by the user as a request for general information.
- **Assistant Reply**: A general-information response, a topic redirect, or a safe status/error
  message associated with a user question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After approval, reviewers confirm replies to all five PRD tax and accounting examples
  are relevant, general in scope, and not personalized advice.
- **SC-002**: After approval, every off-topic test prompt, including a recipe request, receives a
  polite redirect instead of an unrelated answer.
- **SC-003**: After approval, every simulated failure or timeout shows a safe Retry action within
  30 seconds; every rate limit shows a clear retry-later message.
- **SC-004**: The initial chat screen becomes usable in under 2 seconds on a 4G connection.
- **SC-005**: The exact disclaimer is visible at tested mobile and desktop screen sizes, and all
  core actions can be completed by keyboard with new replies announced to screen-reader users.
- **SC-006**: At least 9 of 10 first-time usability-test participants can ask a supported question,
  understand that the answer is general information, and start a new conversation without help.
- **SC-007**: Before explicit project-owner approval, acceptance testing observes zero live requests
  and no credential disclosure when a question is submitted.

## Assumptions

- The primary users are individuals and small-business owners in India seeking quick, general CA
  information.
- The first release uses the English-language examples and terminology in the PRD; additional
  language support is not part of this scope.
- Tax rules and deadlines can change. The assistant must flag information that requires current
  verification and direct users to a qualified CA for advice.
- Conversation content exists only for the current page session. Login, saved history, uploads, and
  streaming are outside the requested product scope.
- Live responses are a release dependency, not an implied approval: the project owner must first
  accept browser credential exposure and confirm restrictions. Until then, the safe unavailable state
  is the expected behavior.
- The 9-of-10 usability target is a proposed v1 baseline because the PRD does not define a user
  satisfaction threshold.
