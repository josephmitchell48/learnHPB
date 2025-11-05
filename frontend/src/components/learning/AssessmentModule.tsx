import { useEffect, useState } from 'react'
import type { CaseAssessment } from '../../types/learning'

type AssessmentModuleProps = {
  assessment?: CaseAssessment
  caseId?: string
}

type QuestionResponse = {
  selectedOptionId: string
  status: 'correct' | 'incorrect'
}

const AssessmentModule = ({ assessment, caseId }: AssessmentModuleProps) => {
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>(
    {},
  )

  useEffect(() => {
    setResponses({})
  }, [caseId, assessment])

  if (!assessment || assessment.questions.length === 0) {
    return null
  }

  const titleId = `assessment-title-${caseId ?? 'current'}`

  const handleSelect = (
    questionId: string,
    optionId: string,
    correctOptionId: string,
  ) => {
    setResponses((previous) => {
      const status = optionId === correctOptionId ? 'correct' : 'incorrect'
      return {
        ...previous,
        [questionId]: { selectedOptionId: optionId, status },
      }
    })
  }

  return (
    <section className="assessment-section" aria-labelledby={titleId}>
      <header className="assessment-header">
        <h2 id={titleId}>{assessment.title}</h2>
        <p>{assessment.intro}</p>
      </header>

      <div className="assessment-questions">
        {assessment.questions.map((question, index) => {
          const response = responses[question.id]
          const questionClasses = ['assessment-question']

          if (response) {
            questionClasses.push('is-answered')
            questionClasses.push(`is-${response.status}`)
          }

          return (
            <article
              key={question.id}
              className={questionClasses.join(' ')}
              aria-describedby={
                response ? `assessment-feedback-${question.id}` : undefined
              }
            >
              <header className="assessment-question__header">
                <span className="assessment-question__badge">
                  Question {index + 1}
                </span>
                <h3>{question.prompt}</h3>
              </header>

              <div className="assessment-options" role="group">
                {question.options.map((option) => {
                  const isSelected = response?.selectedOptionId === option.id
                  const isCorrectSelection =
                    response?.status === 'correct' &&
                    option.id === question.correctOptionId
                  const isIncorrectSelection =
                    response?.status === 'incorrect' && isSelected

                  const optionClasses = ['assessment-option']

                  if (isSelected) {
                    optionClasses.push('is-selected')
                  }

                  if (isCorrectSelection) {
                    optionClasses.push('is-correct')
                  }

                  if (isIncorrectSelection) {
                    optionClasses.push('is-incorrect')
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={optionClasses.join(' ')}
                      aria-pressed={isSelected}
                      onClick={() =>
                        handleSelect(
                          question.id,
                          option.id,
                          question.correctOptionId,
                        )
                      }
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {response && (
                <p
                  id={`assessment-feedback-${question.id}`}
                  className={`assessment-feedback assessment-feedback--${response.status}`}
                >
                  {response.status === 'correct'
                    ? `Correct: ${question.rationale}`
                    : question.hint
                      ? `Hint: ${question.hint}`
                      : 'Review the case information and try again.'}
                </p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default AssessmentModule
